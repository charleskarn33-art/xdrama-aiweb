-- Fixes for two vulnerabilities found in a security review, both exploitable
-- by any authenticated user directly via supabase.rpc()/PostgREST, bypassing
-- the app's server actions entirely:
--
-- 1. profiles_update_own (0001_init.sql) had no column restriction, so any
--    user could update their own `role` to 'admin' and gain is_admin()
--    (0007_admin_access.sql), exposing every user's projects, jobs, and
--    credit wallets via the admin-read RLS policies.
--
-- 2. reserve_credits/settle_job_credits/refund_reserved_credits
--    (0004_credit_functions.sql) are SECURITY DEFINER and GRANTed to
--    `authenticated` with no check that the caller owns p_user_id/the job,
--    and settle_job_credits/refund_reserved_credits were not idempotent —
--    calling either twice on the same job re-applies the refund, letting a
--    user mint unlimited XCredits from their own job. reserve_credits also
--    let a caller drain an arbitrary p_user_id's wallet.

-- --- Fix 1: lock `role` against self-service escalation ---------------

create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
as $$
begin
  -- No admin-granting feature exists yet (it would need its own
  -- SECURITY DEFINER function gated on the caller already being an
  -- admin). Until then, role is immutable via the RLS-scoped client —
  -- any attempted change is silently reverted rather than erroring, so
  -- an otherwise-valid profile update (e.g. display_name) doesn't fail.
  if new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- --- Fix 2: ownership checks + idempotency on credit RPCs --------------

alter table public.ai_jobs add column if not exists credits_settled boolean not null default false;

create or replace function public.reserve_credits(
  p_user_id uuid,
  p_amount numeric,
  p_job_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance numeric;
begin
  if p_user_id <> auth.uid() then
    raise exception 'reserve_credits: not authorized' using errcode = '42501';
  end if;
  if p_amount <= 0 then
    raise exception 'reserve_credits: amount must be positive';
  end if;

  update public.credit_wallets
  set
    available_credits = available_credits - p_amount,
    reserved_credits = reserved_credits + p_amount
  where user_id = p_user_id
    and available_credits >= p_amount
  returning available_credits into v_new_balance;

  if not found then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  insert into public.credit_transactions (user_id, job_id, type, amount, balance_after, description)
  values (p_user_id, p_job_id, 'reserve', -p_amount, v_new_balance, 'Reserved for job ' || p_job_id);
end;
$$;

create or replace function public.settle_job_credits(
  p_job_id uuid,
  p_actual_cost numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_reserved numeric;
  v_refund numeric;
  v_new_available numeric;
begin
  if p_actual_cost < 0 then
    raise exception 'settle_job_credits: actual_cost must not be negative';
  end if;

  -- Atomically claim the job for settlement: the WHERE clause enforces
  -- ownership (user_id = auth.uid()) and single-settlement
  -- (credits_settled = false) in one statement, so a second call on the
  -- same job — whether concurrent or a replay — updates zero rows
  -- instead of re-applying the refund.
  update public.ai_jobs
  set credits_settled = true, actual_cost = p_actual_cost
  where id = p_job_id
    and user_id = auth.uid()
    and credits_settled = false
  returning user_id, estimated_cost into v_user_id, v_reserved;

  if not found then
    raise exception 'settle_job_credits: job % not found, not owned by caller, or already settled', p_job_id;
  end if;

  v_reserved := coalesce(v_reserved, p_actual_cost);
  v_refund := greatest(v_reserved - p_actual_cost, 0);

  update public.credit_wallets
  set
    reserved_credits = greatest(reserved_credits - v_reserved, 0),
    available_credits = available_credits + v_refund,
    used_credits = used_credits + p_actual_cost
  where user_id = v_user_id
  returning available_credits into v_new_available;

  insert into public.credit_transactions (user_id, job_id, type, amount, balance_after, description)
  values (v_user_id, p_job_id, 'settle', -p_actual_cost, v_new_available, 'Settled job ' || p_job_id);

  if v_refund > 0 then
    insert into public.credit_transactions (user_id, job_id, type, amount, balance_after, description)
    values (v_user_id, p_job_id, 'refund', v_refund, v_new_available, 'Unused reservation for job ' || p_job_id);
  end if;
end;
$$;

create or replace function public.refund_reserved_credits(
  p_job_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_reserved numeric;
  v_new_available numeric;
begin
  update public.ai_jobs
  set credits_settled = true
  where id = p_job_id
    and user_id = auth.uid()
    and credits_settled = false
  returning user_id, estimated_cost into v_user_id, v_reserved;

  if not found or v_reserved is null or v_reserved <= 0 then
    return;
  end if;

  update public.credit_wallets
  set
    reserved_credits = greatest(reserved_credits - v_reserved, 0),
    available_credits = available_credits + v_reserved
  where user_id = v_user_id
  returning available_credits into v_new_available;

  insert into public.credit_transactions (user_id, job_id, type, amount, balance_after, description)
  values (v_user_id, p_job_id, 'refund', v_reserved, v_new_available, 'Job ' || p_job_id || ' did not run');
end;
$$;
