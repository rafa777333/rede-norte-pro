drop policy if exists "public can submit pending jobs" on public.jobs;
create policy "public can submit pending jobs" on public.jobs for insert to anon, authenticated with check (status = 'pending');
