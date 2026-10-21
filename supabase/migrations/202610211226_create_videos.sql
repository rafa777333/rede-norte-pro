create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  video_url text,
  thumbnail_url text,
  instagram_url text,
  cidade_slug text references public.cities(slug),
  categoria text not null default 'Matéria',
  materia_url text,
  tipo text not null default 'upload' check (tipo in ('upload','instagram')),
  status text not null default 'published' check (status in ('draft','published')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint videos_source_check check (video_url is not null or instagram_url is not null)
);
create index if not exists videos_status_published_at_idx on public.videos(status, published_at desc);
create index if not exists videos_cidade_slug_idx on public.videos(cidade_slug);
create unique index if not exists videos_video_url_uidx on public.videos(video_url) where video_url is not null;
create unique index if not exists videos_instagram_url_uidx on public.videos(instagram_url) where instagram_url is not null;
alter table public.videos enable row level security;
drop policy if exists "videos_public_read" on public.videos;
create policy "videos_public_read" on public.videos for select using (status = 'published');
drop policy if exists "videos_authenticated_manage" on public.videos;
create policy "videos_authenticated_manage" on public.videos for all to authenticated using (true) with check (true);
