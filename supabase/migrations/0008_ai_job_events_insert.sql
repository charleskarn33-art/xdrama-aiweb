-- ai_job_events had SELECT-only RLS (0001_init.sql) — every insert from
-- src/lib/ai/jobs.ts (QUEUED/STARTING/FAILED events) was silently denied
-- by the default-deny RLS posture, so the job event timeline was always
-- empty. Add the missing INSERT policy, scoped the same way SELECT is:
-- only for events on a job the caller owns.

create policy "ai_job_events_owner_insert" on public.ai_job_events
  for insert with check (
    exists (
      select 1 from public.ai_jobs j
      where j.id = job_id and j.user_id = auth.uid()
    )
  );
