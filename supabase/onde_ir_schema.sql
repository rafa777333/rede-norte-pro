-- ==============================================================================
-- MIGRAÇÃO / SETUP: Tabela onde_ir_places e Storage para a Vitrine Interativa
-- Arquivo: supabase/onde_ir_schema.sql
-- ==============================================================================

-- 1. Criação da Tabela onde_ir_places
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

-- 2. Índices de Performance para a Vitrine Pública
CREATE INDEX IF NOT EXISTS onde_ir_places_vip_active_idx ON public.onde_ir_places(is_active, is_vip DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS onde_ir_places_city_idx ON public.onde_ir_places(city);
CREATE INDEX IF NOT EXISTS onde_ir_places_category_idx ON public.onde_ir_places(category);
CREATE UNIQUE INDEX IF NOT EXISTS onde_ir_places_slug_uidx ON public.onde_ir_places(slug);

-- 3. Trigger para Atualização Automática de updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_onde_ir_places_updated_at ON public.onde_ir_places;
CREATE TRIGGER trigger_onde_ir_places_updated_at
BEFORE UPDATE ON public.onde_ir_places
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 4. Configuração de RLS (Row Level Security)
ALTER TABLE public.onde_ir_places ENABLE ROW LEVEL SECURITY;

-- Leitura pública para todos os visitantes
DROP POLICY IF EXISTS "Public read access for onde_ir_places" ON public.onde_ir_places;
CREATE POLICY "Public read access for onde_ir_places"
ON public.onde_ir_places FOR SELECT
USING (true);

-- Permissões totais para o painel administrativo (anon + service_role)
DROP POLICY IF EXISTS "Admin write access for onde_ir_places" ON public.onde_ir_places;
CREATE POLICY "Admin write access for onde_ir_places"
ON public.onde_ir_places FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Configuração do Storage (Bucket: rede-norte-media)
INSERT INTO storage.buckets (id, name, public)
VALUES ('rede-norte-media', 'rede-norte-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage para upload e leitura de mídia
DROP POLICY IF EXISTS "Public read for rede-norte-media" ON storage.objects;
CREATE POLICY "Public read for rede-norte-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'rede-norte-media');

DROP POLICY IF EXISTS "Public/Admin upload for rede-norte-media" ON storage.objects;
CREATE POLICY "Public/Admin upload for rede-norte-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'rede-norte-media');

DROP POLICY IF EXISTS "Public/Admin update for rede-norte-media" ON storage.objects;
CREATE POLICY "Public/Admin update for rede-norte-media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'rede-norte-media');

DROP POLICY IF EXISTS "Public/Admin delete for rede-norte-media" ON storage.objects;
CREATE POLICY "Public/Admin delete for rede-norte-media"
ON storage.objects FOR DELETE
USING (bucket_id = 'rede-norte-media');
