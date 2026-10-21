create table if not exists public.weather_current (
  cidade_slug text primary key,
  cidade_nome text not null,
  latitude double precision not null,
  longitude double precision not null,
  temperatura numeric,
  temperatura_minima numeric,
  temperatura_maxima numeric,
  codigo_tempo integer,
  condicao text,
  atualizado_em timestamptz not null default now()
);

alter table public.weather_current enable row level security;
drop policy if exists "public can read current weather" on public.weather_current;
create policy "public can read current weather" on public.weather_current for select to anon, authenticated using (true);
