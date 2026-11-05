-- Migration: 202611051900_create_onde_ir_places.sql
-- Tabela onde_ir_places e Storage para a Vitrine Interativa

CREATE TABLE IF NOT EXISTS public.onde_ir_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  address TEXT,
  whatsapp TEXT,
  instagram TEXT,
  google_maps_url TEXT,
  is_vip BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 5.0,
  open_hours JSONB DEFAULT '{"open": "18:00", "close": "23:30", "days": "Segunda a Sábado"}'::jsonb,
  cover_image TEXT NOT NULL,
  logo TEXT,
  video_url TEXT,
  video_thumbnail TEXT,
  active_promo JSONB DEFAULT NULL,
  menu_highlights JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onde_ir_places_vip_active_idx ON public.onde_ir_places(is_active, is_vip DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS onde_ir_places_city_idx ON public.onde_ir_places(city);
CREATE INDEX IF NOT EXISTS onde_ir_places_category_idx ON public.onde_ir_places(category);
CREATE UNIQUE INDEX IF NOT EXISTS onde_ir_places_slug_uidx ON public.onde_ir_places(slug);

ALTER TABLE public.onde_ir_places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for onde_ir_places" ON public.onde_ir_places;
CREATE POLICY "Public read access for onde_ir_places"
ON public.onde_ir_places FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admin write access for onde_ir_places" ON public.onde_ir_places;
CREATE POLICY "Admin write access for onde_ir_places"
ON public.onde_ir_places FOR ALL
USING (true)
WITH CHECK (true);
