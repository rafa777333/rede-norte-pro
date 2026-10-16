-- Foundation for Rede Norte content, automation drafts and regional directories.
-- Applied to the connected Supabase project.

create extension if not exists pgcrypto;

alter table public.news add column if not exists resumo text;
alter table public.news add column if not exists slug text;
alter table public.news add column if not exists autor text default 'Redação Rede Norte';
alter table public.news add column if not exists fonte text;
alter table public.news add column if not exists status text not null default 'published';
alter table public.news add column if not exists published_at timestamptz default now();
alter table public.news add column if not exists updated_at timestamptz default now();
create unique index if not exists news_slug_uidx on public.news(slug) where slug is not null;

alter table public.service_providers add column if not exists slug text;
alter table public.service_providers add column if not exists endereco text;
alter table public.service_providers add column if not exists descricao text;
alter table public.service_providers add column if not exists imagem text;
alter table public.service_providers add column if not exists updated_at timestamptz default now();
create unique index if not exists service_providers_slug_uidx on public.service_providers(slug) where slug is not null;

alter table public.jobs add column if not exists slug text;
alter table public.jobs add column if not exists imagem text;
alter table public.jobs add column if not exists status text not null default 'published';
alter table public.jobs add column if not exists updated_at timestamptz default now();
create unique index if not exists jobs_slug_uidx on public.jobs(slug) where slug is not null;

create table if not exists public.classified_ads (id uuid primary key default gen_random_uuid(), titulo text not null, slug text, cidade_slug text not null references public.cities(slug), categoria text not null default 'Outros', preco text, descricao text, imagem text, contato text, status text not null default 'published', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create unique index if not exists classified_ads_slug_uidx on public.classified_ads(slug) where slug is not null;

create table if not exists public.promotions (id uuid primary key default gen_random_uuid(), titulo text not null, slug text, cidade_slug text not null references public.cities(slug), categoria text not null default 'Comércio', validade text, detalhes text, imagem text, contato text, status text not null default 'published', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create unique index if not exists promotions_slug_uidx on public.promotions(slug) where slug is not null;

insert into public.cities (slug, nome, estado) values
('apucarana','Apucarana','PR'),('arapongas','Arapongas','PR'),('arapua','Arapuã','PR'),('ariranha-do-ivai','Ariranha do Ivaí','PR'),('bom-sucesso','Bom Sucesso','PR'),('borrazopolis','Borrazópolis','PR'),('california','Califórnia','PR'),('cambira','Cambira','PR'),('cruzmaltina','Cruzmaltina','PR'),('faxinal','Faxinal','PR'),('godoy-moreira','Godoy Moreira','PR'),('grandes-rios','Grandes Rios','PR'),('ivaipora','Ivaiporã','PR'),('jandaia-do-sul','Jandaia do Sul','PR'),('jardim-alegre','Jardim Alegre','PR'),('kalore','Kaloré','PR'),('lidianopolis','Lidianópolis','PR'),('lunardelli','Lunardelli','PR'),('marilandia-do-sul','Marilândia do Sul','PR'),('marumbi','Marumbi','PR'),('maua-da-serra','Mauá da Serra','PR'),('novo-itacolomi','Novo Itacolomi','PR'),('rio-bom','Rio Bom','PR'),('rio-branco-do-ivai','Rio Branco do Ivaí','PR'),('rosario-do-ivai','Rosário do Ivaí','PR'),('sao-joao-do-ivai','São João do Ivaí','PR'),('sao-pedro-do-ivai','São Pedro do Ivaí','PR')
on conflict (slug) do update set nome = excluded.nome, estado = excluded.estado;

insert into storage.buckets (id, name, public) values ('rede-norte-media', 'rede-norte-media', true) on conflict (id) do update set public = excluded.public;

create index if not exists classified_ads_cidade_slug_idx on public.classified_ads(cidade_slug);
create index if not exists jobs_cidade_slug_idx on public.jobs(cidade_slug);
create index if not exists market_offers_cidade_slug_idx on public.market_offers(cidade_slug);
create index if not exists market_offers_market_id_idx on public.market_offers(market_id);
create index if not exists markets_cidade_slug_idx on public.markets(cidade_slug);
create index if not exists promotions_cidade_slug_idx on public.promotions(cidade_slug);
create index if not exists service_providers_cidade_slug_idx on public.service_providers(cidade_slug);
create index if not exists news_status_published_at_idx on public.news(status, published_at desc);
