-- Migration: 202611111800_update_news_video_seo.sql
-- Adiciona suporte nativo a Vídeos e Otimização para Motores de Busca (SEO/Google) na tabela news

-- 1. Colunas exigidas
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 2. Índices para performance e unicidade do slug
CREATE UNIQUE INDEX IF NOT EXISTS news_slug_uidx ON public.news(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS news_created_at_desc_idx ON public.news(created_at DESC);

-- 3. Sincronização retroativa com campos legados (titulo, resumo, conteudo)
UPDATE public.news
SET
  title = COALESCE(title, titulo),
  seo_description = COALESCE(seo_description, resumo),
  content = COALESCE(content, conteudo)
WHERE title IS NULL OR seo_description IS NULL OR content IS NULL;

-- 4. Políticas de RLS para leitura pública e escrita com service role
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for news" ON public.news;
CREATE POLICY "Public read access for news" ON public.news FOR SELECT USING (true);

DROP POLICY IF EXISTS "Full access for service role on news" ON public.news;
CREATE POLICY "Full access for service role on news" ON public.news FOR ALL USING (true);
