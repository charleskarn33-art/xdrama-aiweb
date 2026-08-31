-- Admin Dashboard read access (architecture spec section 51).
--
-- Admins are regular users with profiles.role = 'admin'. There is no
-- separate service-role bypass here — the dashboard reads through the
-- normal RLS-protected client, just with an extra policy that only
-- applies to admins.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create policy "profiles_admin_read" on public.profiles
  for select using (public.is_admin());

create policy "projects_admin_read" on public.projects
  for select using (public.is_admin());

create policy "ai_jobs_admin_read" on public.ai_jobs
  for select using (public.is_admin());

create policy "credit_wallets_admin_read" on public.credit_wallets
  for select using (public.is_admin());

create policy "credit_transactions_admin_read" on public.credit_transactions
  for select using (public.is_admin());
