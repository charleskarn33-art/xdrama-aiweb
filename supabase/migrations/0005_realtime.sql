-- Enable Supabase Realtime on the tables the job-status UI subscribes to
-- (architecture spec section 15: users should see job progress without
-- refreshing the page).

alter publication supabase_realtime add table public.ai_jobs;
alter publication supabase_realtime add table public.ai_job_events;
