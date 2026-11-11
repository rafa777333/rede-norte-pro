-- ==============================================================================
-- MIGRAÇÃO: Tabela places_analytics e RPC para Tracking Silencioso de Engajamento
-- Guia "Para Onde Ir" - Rede Apucarana
-- ==============================================================================

-- 1. Criação da Tabela de Analytics
CREATE TABLE IF NOT EXISTS public.places_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT UNIQUE NOT NULL,
  views_count INTEGER NOT NULL DEFAULT 0,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Índices para Alto Desempenho
CREATE INDEX IF NOT EXISTS places_analytics_place_id_idx ON public.places_analytics(place_id);

-- 3. Habilita RLS (Row Level Security)
ALTER TABLE public.places_analytics ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acesso
DROP POLICY IF EXISTS "Public read access for places_analytics" ON public.places_analytics;
CREATE POLICY "Public read access for places_analytics"
ON public.places_analytics FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public insert/update access for places_analytics" ON public.places_analytics;
CREATE POLICY "Public insert/update access for places_analytics"
ON public.places_analytics FOR ALL
USING (true)
WITH CHECK (true);

-- 5. RPC Atômica para Incrementação de Visualizações e Cliques sem Deadlock
CREATE OR REPLACE FUNCTION increment_place_analytics(
  target_place_id TEXT,
  increment_views INTEGER DEFAULT 0,
  increment_clicks INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.places_analytics (place_id, views_count, clicks_count, updated_at)
  VALUES (target_place_id, increment_views, increment_clicks, now())
  ON CONFLICT (place_id) DO UPDATE SET
    views_count = public.places_analytics.views_count + increment_views,
    clicks_count = public.places_analytics.clicks_count + increment_clicks,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 6. RPC para Zerar Estatísticas de um Local (ou de todos) para Fechamento de Mês
CREATE OR REPLACE FUNCTION reset_place_analytics(
  target_place_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF target_place_id IS NULL OR target_place_id = 'all' THEN
    UPDATE public.places_analytics
    SET views_count = 0, clicks_count = 0, updated_at = now();
  ELSE
    UPDATE public.places_analytics
    SET views_count = 0, clicks_count = 0, updated_at = now()
    WHERE place_id = target_place_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
