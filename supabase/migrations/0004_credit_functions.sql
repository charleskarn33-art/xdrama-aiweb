-- Credit reservation/settlement (architecture spec section 16).
--
-- Flow: reserve_credits before a job runs, settle_job_credits once the
-- provider reports actual cost, or refund_reserved_credits if the job
-- never ran (submission failed, cancelled). All three are single
-- statements per table so a concurrent job on the same wallet can't race
-- past the balance check — the UPDATE's WHERE clause re-checks the
-- balance atomically instead of trusting a prior SELECT.

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
  v_new_used numeric;
begin
  select user_id, estimated_cost into v_user_id, v_reserved
  from public.ai_jobs
  where id = p_job_id;

  if v_user_id is null then
    raise exception 'settle_job_credits: job % not found', p_job_id;
  end if;

  v_reserved := coalesce(v_reserved, p_actual_cost);
  v_refund := greatest(v_reserved - p_actual_cost, 0);

  update public.credit_wallets
  set
    reserved_credits = greatest(reserved_credits - v_reserved, 0),
    available_credits = available_credits + v_refund,
    used_credits = used_credits + p_actual_cost
  where user_id = v_user_id
  returning available_credits, used_credits into v_new_available, v_new_used;

  insert into public.credit_transactions (user_id, job_id, type, amount, balance_after, description)
  values (v_user_id, p_job_id, 'settle', -p_actual_cost, v_new_available, 'Settled job ' || p_job_id);

  if v_refund > 0 then
    insert into public.credit_transactions (user_id, job_id, type, amount, balance_after, description)
    values (v_user_id, p_job_id, 'refund', v_refund, v_new_available, 'Unused reservation for job ' || p_job_id);
  end if;

  update public.ai_jobs set actual_cost = p_actual_cost where id = p_job_id;
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
  select user_id, estimated_cost into v_user_id, v_reserved
  from public.ai_jobs
  where id = p_job_id;

  if v_user_id is null or v_reserved is null or v_reserved <= 0 then
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

grant execute on function public.reserve_credits(uuid, numeric, uuid) to authenticated;
grant execute on function public.settle_job_credits(uuid, numeric) to authenticated;
grant execute on function public.refund_reserved_credits(uuid) to authenticated;
