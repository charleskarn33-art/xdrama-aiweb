-- Timeline data model (architecture spec section 30).
--
-- One row per project. `tracks` is a JSON array of
-- { id, type, name, clips: [{ id, sourceType, sourceId, label, durationSeconds }] }
-- where type is one of: video, audio, voice, music, sfx, subtitles,
-- transitions, overlays. This is the same shape Movie Composer will read
-- into `render_jobs.timeline_snapshot` when a render is submitted, so
-- there's no format to translate later.

create table public.timelines (
  project_id uuid primary key references public.projects (id) on delete cascade,
  tracks jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger timelines_set_updated_at
  before update on public.timelines
  for each row execute function public.set_updated_at();

alter table public.timelines enable row level security;

create policy "timelines_owner_all" on public.timelines
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));
