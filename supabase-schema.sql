-- REDE NORTE - SCHEMA PROFISSIONAL
-- Rodar no SQL Editor do Supabase

-- CIDADES (8 do Vale)
create table if not exists cities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null,
  estado text default 'PR',
  created_at timestamp default now()
);
insert into cities (slug,nome) values
('apucarana','Apucarana'),('arapongas','Arapongas'),('ivaipora','Ivaiporã'),
('jandaia-do-sul','Jandaia do Sul'),('cambira','Cambira'),('faxinal','Faxinal'),
('sao-joao-do-ivai','São João do Ivaí'),('jardim-alegre','Jardim Alegre')
on conflict (slug) do nothing;

-- NOTICIAS GLOBAL
create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text,
  conteudo text,
  imagem text,
  cidade_slug text, -- opcional, mas continua global
  created_at timestamp default now()
);

-- SERVICOS
create table if not exists service_providers (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null,
  cidade_slug text not null references cities(slug),
  whatsapp text,
  nota numeric default 5.0,
  verificado boolean default true,
  created_at timestamp default now()
);

-- MERCADOS
create table if not exists markets (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade_slug text not null references cities(slug),
  logo text,
  created_at timestamp default now()
);

-- OFERTAS (Radar)
create table if not exists market_offers (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references markets(id),
  mercado_nome text not null,
  cidade_slug text not null references cities(slug),
  produto text not null,
  preco numeric not null,
  unidade text default 'un',
  valido_ate text,
  imagem_encarte text,
  fonte text default 'manual',
  created_at timestamp default now()
);

-- VAGAS
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  empresa text not null,
  vaga text not null,
  cidade_slug text not null references cities(slug),
  tipo text default 'CLT',
  descricao text,
  contato text,
  created_at timestamp default now()
);

-- Habilitar RLS e liberar leitura publica
alter table cities enable row level security;
alter table news enable row level security;
alter table service_providers enable row level security;
alter table markets enable row level security;
alter table market_offers enable row level security;
alter table jobs enable row level security;

create policy "public read" on cities for select using (true);
create policy "public read" on news for select using (true);
create policy "public read" on service_providers for select using (true);
create policy "public read" on markets for select using (true);
create policy "public read" on market_offers for select using (true);
create policy "public read" on jobs for select using (true);
-- Insert liberado para MVP (depois criar auth)
create policy "public insert" on news for insert with check (true);
create policy "public insert" on service_providers for insert with check (true);
create policy "public insert" on market_offers for insert with check (true);
create policy "public insert" on jobs for insert with check (true);
