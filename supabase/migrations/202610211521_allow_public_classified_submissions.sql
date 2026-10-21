drop policy if exists "public can submit pending classified ads" on public.classified_ads;
create policy "public can submit pending classified ads" on public.classified_ads for insert to anon, authenticated with check (status = 'pending');
