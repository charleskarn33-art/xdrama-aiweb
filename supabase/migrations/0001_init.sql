-- XDrama AI Studio — initial schema
-- Core tables, indexes, and Row Level Security policies.
-- Every user-owned table is scoped to auth.uid() so a user can only ever
-- see/modify their own projects, scripts, characters, locations, assets,
-- jobs, exports, credits, and settings.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- True when the current user owns the given project.
create or replace function public.owns_project(project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.projects p
    where p.id = project_id and p.created_by = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;

  insert into public.credit_wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  type text not null check (
    type in ('movie', 'drama', 'short_film', 'trailer', 'music_video', 'commercial', 'documentary')
  ),
  genre text,
  language text default 'en',
  country text,
  aspect_ratio text default '16:9',
  target_resolution text default '1080p',
  estimated_duration_seconds integer,
  cover_image_path text,
  status text not null default 'draft' check (
    status in ('draft', 'in_progress', 'completed', 'archived')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_created_by_idx on public.projects (created_by);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

create policy "projects_owner_all" on public.projects
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

create table public.project_settings (
  project_id uuid primary key references public.projects (id) on delete cascade,
  cultural_context jsonb not null default '{}'::jsonb,
  default_model_id text,
  default_workflow_id text,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger project_settings_set_updated_at
  before update on public.project_settings
  for each row execute function public.set_updated_at();

alter table public.project_settings enable row level security;

create policy "project_settings_owner_all" on public.project_settings
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));

-- ---------------------------------------------------------------------
-- scripts + versions
-- ---------------------------------------------------------------------

create table public.scripts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null default 'Untitled Script',
  content jsonb not null default '{}'::jsonb,
  format text not null default 'richtext' check (format in ('richtext', 'fountain', 'plain')),
  word_count integer not null default 0,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scripts_project_id_idx on public.scripts (project_id);

create trigger scripts_set_updated_at
  before update on public.scripts
  for each row execute function public.set_updated_at();

alter table public.scripts enable row level security;

create policy "scripts_owner_all" on public.scripts
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));

create table public.script_versions (
  id uuid primary key default gen_random_uuid(),
  script_id uuid not null references public.scripts (id) on delete cascade,
  version_number integer not null,
  content jsonb not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (script_id, version_number)
);

alter table public.script_versions enable row level security;

create policy "script_versions_owner_all" on public.script_versions
  for all using (
    exists (
      select 1 from public.scripts s
      where s.id = script_id and public.owns_project(s.project_id)
    )
  );

-- ---------------------------------------------------------------------
-- locations
-- ---------------------------------------------------------------------

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  description text,
  lighting text,
  weather text,
  time_of_day text,
  architectural_style text,
  color_palette jsonb default '[]'::jsonb,
  camera_presets jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index locations_project_id_idx on public.locations (project_id);

create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

alter table public.locations enable row level security;

create policy "locations_owner_all" on public.locations
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));

create table public.location_references (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.location_references enable row level security;

create policy "location_references_owner_all" on public.location_references
  for all using (
    exists (
      select 1 from public.locations l
      where l.id = location_id and public.owns_project(l.project_id)
    )
  );

-- ---------------------------------------------------------------------
-- characters
-- ---------------------------------------------------------------------

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  age text,
  gender text,
  appearance jsonb default '{}'::jsonb,
  personality text,
  voice_id text,
  negative_attributes text,
  visual_style text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index characters_project_id_idx on public.characters (project_id);

create trigger characters_set_updated_at
  before update on public.characters
  for each row execute function public.set_updated_at();

alter table public.characters enable row level security;

create policy "characters_owner_all" on public.characters
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));

create table public.character_references (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters (id) on delete cascade,
  storage_path text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.character_references enable row level security;

create policy "character_references_owner_all" on public.character_references
  for all using (
    exists (
      select 1 from public.characters c
      where c.id = character_id and public.owns_project(c.project_id)
    )
  );

-- ---------------------------------------------------------------------
-- props
-- ---------------------------------------------------------------------

create table public.props (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  description text,
  storage_path text,
  created_at timestamptz not null default now()
);

create index props_project_id_idx on public.props (project_id);

alter table public.props enable row level security;

create policy "props_owner_all" on public.props
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));

-- ---------------------------------------------------------------------
-- scenes + shots
-- ---------------------------------------------------------------------

create table public.scenes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  script_id uuid references public.scripts (id) on delete set null,
  location_id uuid references public.locations (id) on delete set null,
  scene_number integer not null,
  heading text,
  int_ext text check (int_ext in ('INT', 'EXT', 'INT/EXT')),
  time_of_day text,
  description text,
  mood text,
  estimated_duration_seconds integer,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scenes_project_id_idx on public.scenes (project_id);

create trigger scenes_set_updated_at
  before update on public.scenes
  for each row execute function public.set_updated_at();

alter table public.scenes enable row level security;

create policy "scenes_owner_all" on public.scenes
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));

create table public.shots (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null references public.scenes (id) on delete cascade,
  shot_number integer not null,
  camera_angle text,
  camera_movement text,
  lens text,
  composition text,
  prompt text,
  negative_prompt text,
  duration_seconds numeric,
  order_index integer not null default 0,
  status text not null default 'pending' check (
    status in ('pending', 'generating', 'completed', 'failed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shots_scene_id_idx on public.shots (scene_id);

create trigger shots_set_updated_at
  before update on public.shots
  for each row execute function public.set_updated_at();

alter table public.shots enable row level security;

create policy "shots_owner_all" on public.shots
  for all using (
    exists (
      select 1 from public.scenes sc
      where sc.id = scene_id and public.owns_project(sc.project_id)
    )
  );

-- ---------------------------------------------------------------------
-- storyboards
-- ---------------------------------------------------------------------

create table public.storyboards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  scene_id uuid references public.scenes (id) on delete cascade,
  shot_id uuid references public.shots (id) on delete cascade,
  frame_number integer not null default 1,
  storage_path text,
  camera_angle text,
  camera_movement text,
  lens text,
  composition text,
  prompt text,
  negative_prompt text,
  duration_seconds numeric,
  created_at timestamptz not null default now()
);

create index storyboards_project_id_idx on public.storyboards (project_id);

alter table public.storyboards enable row level security;

create policy "storyboards_owner_all" on public.storyboards
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));

-- ---------------------------------------------------------------------
-- assets
-- ---------------------------------------------------------------------

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (
    type in ('image', 'video', 'audio', 'character', 'location', 'prop', 'music', 'voice', 'storyboard')
  ),
  storage_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index assets_project_id_idx on public.assets (project_id);
create index assets_user_id_idx on public.assets (user_id);

alter table public.assets enable row level security;

create policy "assets_owner_all" on public.assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- ai_models (model registry) + ai_workflows
-- ---------------------------------------------------------------------

create table public.ai_models (
  id text primary key,
  name text not null,
  provider text not null,
  version text not null,
  type text not null check (type in ('video', 'image', 'audio', 'tts', 'lip_sync', 'llm')),
  description text,
  capabilities text[] not null default '{}',
  minimum_vram_gb numeric,
  recommended_vram_gb numeric,
  supported_resolutions text[] not null default '{}',
  supported_fps integer[] not null default '{}',
  maximum_duration_seconds numeric,
  input_types text[] not null default '{}',
  output_types text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'beta', 'deprecated', 'unavailable')),
  enabled boolean not null default true,
  priority integer not null default 100,
  cost_multiplier numeric not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ai_models_set_updated_at
  before update on public.ai_models
  for each row execute function public.set_updated_at();

alter table public.ai_models enable row level security;

create policy "ai_models_public_read" on public.ai_models
  for select using (enabled = true);

create table public.ai_workflows (
  id text primary key,
  name text not null,
  category text not null,
  version text not null default '1',
  model_requirements jsonb not null default '{}'::jsonb,
  input_schema jsonb not null default '{}'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  parameters jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'beta', 'deprecated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ai_workflows_set_updated_at
  before update on public.ai_workflows
  for each row execute function public.set_updated_at();

alter table public.ai_workflows enable row level security;

create policy "ai_workflows_public_read" on public.ai_workflows
  for select using (status <> 'deprecated');

-- ---------------------------------------------------------------------
-- ai_jobs + ai_job_events
-- ---------------------------------------------------------------------

create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  scene_id uuid references public.scenes (id) on delete set null,
  shot_id uuid references public.shots (id) on delete set null,
  job_type text not null,
  model_id text references public.ai_models (id),
  workflow_id text references public.ai_workflows (id),
  provider text not null default 'modal',
  status text not null default 'QUEUED' check (
    status in (
      'QUEUED', 'STARTING', 'PREPARING', 'MODEL_LOADING', 'GENERATING',
      'POST_PROCESSING', 'UPLOADING', 'COMPLETED', 'FAILED', 'CANCELLED'
    )
  ),
  progress integer not null default 0 check (progress between 0 and 100),
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  error_message text,
  input_metadata jsonb not null default '{}'::jsonb,
  output_metadata jsonb not null default '{}'::jsonb,
  storage_path text,
  gpu_type text,
  gpu_seconds numeric,
  estimated_cost numeric,
  actual_cost numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_jobs_user_id_idx on public.ai_jobs (user_id);
create index ai_jobs_project_id_idx on public.ai_jobs (project_id);
create index ai_jobs_status_idx on public.ai_jobs (status);

create trigger ai_jobs_set_updated_at
  before update on public.ai_jobs
  for each row execute function public.set_updated_at();

alter table public.ai_jobs enable row level security;

create policy "ai_jobs_owner_all" on public.ai_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.ai_job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.ai_jobs (id) on delete cascade,
  status text not null,
  message text,
  progress integer,
  created_at timestamptz not null default now()
);

create index ai_job_events_job_id_idx on public.ai_job_events (job_id);

alter table public.ai_job_events enable row level security;

create policy "ai_job_events_owner_read" on public.ai_job_events
  for select using (
    exists (
      select 1 from public.ai_jobs j
      where j.id = job_id and j.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- render_jobs + exports
-- ---------------------------------------------------------------------

create table public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  timeline_snapshot jsonb not null default '{}'::jsonb,
  output_format text not null default 'mp4',
  resolution text not null default '1080p',
  fps integer not null default 24,
  codec text not null default 'h264',
  status text not null default 'QUEUED' check (
    status in ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')
  ),
  progress integer not null default 0 check (progress between 0 and 100),
  storage_path text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index render_jobs_project_id_idx on public.render_jobs (project_id);

create trigger render_jobs_set_updated_at
  before update on public.render_jobs
  for each row execute function public.set_updated_at();

alter table public.render_jobs enable row level security;

create policy "render_jobs_owner_all" on public.render_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  render_job_id uuid references public.render_jobs (id) on delete set null,
  platform_preset text,
  format text not null default 'mp4',
  resolution text not null default '1080p',
  fps integer not null default 24,
  codec text not null default 'h264',
  storage_path text,
  file_size_bytes bigint,
  status text not null default 'PENDING' check (status in ('PENDING', 'READY', 'FAILED')),
  created_at timestamptz not null default now()
);

create index exports_project_id_idx on public.exports (project_id);

alter table public.exports enable row level security;

create policy "exports_owner_all" on public.exports
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));

-- ---------------------------------------------------------------------
-- credits: wallets, transactions, packages
-- ---------------------------------------------------------------------

create table public.credit_wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  available_credits numeric not null default 0,
  used_credits numeric not null default 0,
  reserved_credits numeric not null default 0,
  updated_at timestamptz not null default now()
);

create trigger credit_wallets_set_updated_at
  before update on public.credit_wallets
  for each row execute function public.set_updated_at();

alter table public.credit_wallets enable row level security;

create policy "credit_wallets_owner_read" on public.credit_wallets
  for select using (auth.uid() = user_id);

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid references public.ai_jobs (id) on delete set null,
  type text not null check (
    type in ('purchase', 'reserve', 'settle', 'refund', 'adjustment')
  ),
  amount numeric not null,
  balance_after numeric not null,
  description text,
  created_at timestamptz not null default now()
);

create index credit_transactions_user_id_idx on public.credit_transactions (user_id);

alter table public.credit_transactions enable row level security;

create policy "credit_transactions_owner_read" on public.credit_transactions
  for select using (auth.uid() = user_id);

create table public.credit_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  credits numeric not null,
  price_cents integer not null,
  currency text not null default 'usd',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.credit_packages enable row level security;

create policy "credit_packages_public_read" on public.credit_packages
  for select using (active = true);

-- ---------------------------------------------------------------------
-- notifications, user_settings, audit_logs
-- ---------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);

alter table public.notifications enable row level security;

create policy "notifications_owner_all" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

create policy "user_settings_owner_all" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_user_id_idx on public.audit_logs (user_id);

alter table public.audit_logs enable row level security;

create policy "audit_logs_owner_read" on public.audit_logs
  for select using (auth.uid() = user_id);

-- Only the trigger (security definer) writes profiles/wallets on signup —
-- must be created after both target tables exist.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
