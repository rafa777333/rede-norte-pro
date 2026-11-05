-- Migration: 202611052000_create_ofertas_tables.sql
-- Tabelas para a Central de Economia, Termômetro de Preços & Encartes

CREATE TABLE IF NOT EXISTS public.ofertas_thermometer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Cesta Básica',
  unit TEXT NOT NULL DEFAULT 'un',
  avg_price NUMERIC(10,2) NOT NULL,
  lowest_price NUMERIC(10,2) NOT NULL,
  partner_name TEXT NOT NULL,
  partner_whatsapp TEXT,
  partner_id UUID,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ofertas_thermometer_active_idx ON public.ofertas_thermometer(is_active, order_index ASC);

CREATE TABLE IF NOT EXISTS public.ofertas_retailers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Apucarana',
  neighborhood TEXT,
  address TEXT,
  logo TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  flyer_pdf_or_image TEXT,
  whatsapp TEXT NOT NULL,
  vip_group_url TEXT,
  is_vip BOOLEAN DEFAULT false,
  theme_day TEXT DEFAULT 'Todos os Dias',
  valid_until TEXT NOT NULL DEFAULT 'Ofertas válidas hoje!',
  stories_items JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ofertas_retailers_vip_active_idx ON public.ofertas_retailers(is_active, is_vip DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS ofertas_retailers_cat_idx ON public.ofertas_retailers(category);
CREATE INDEX IF NOT EXISTS ofertas_retailers_day_idx ON public.ofertas_retailers(theme_day);
CREATE INDEX IF NOT EXISTS ofertas_retailers_city_idx ON public.ofertas_retailers(city);
CREATE UNIQUE INDEX IF NOT EXISTS ofertas_retailers_slug_uidx ON public.ofertas_retailers(slug);

ALTER TABLE public.ofertas_thermometer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas_retailers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for ofertas_thermometer" ON public.ofertas_thermometer;
CREATE POLICY "Public read access for ofertas_thermometer" ON public.ofertas_thermometer FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write access for ofertas_thermometer" ON public.ofertas_thermometer;
CREATE POLICY "Admin write access for ofertas_thermometer" ON public.ofertas_thermometer FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read access for ofertas_retailers" ON public.ofertas_retailers;
CREATE POLICY "Public read access for ofertas_retailers" ON public.ofertas_retailers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write access for ofertas_retailers" ON public.ofertas_retailers;
CREATE POLICY "Admin write access for ofertas_retailers" ON public.ofertas_retailers FOR ALL USING (true) WITH CHECK (true);
