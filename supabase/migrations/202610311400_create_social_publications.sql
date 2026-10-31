-- Migration: 202610311400_create_social_publications.sql
-- Description: Tabela para gerenciar a publicação automatizada de notícias nas redes sociais (Meta + Canva + n8n)

-- 1. Criação do Enum para status da publicação
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'social_publication_status') THEN
    CREATE TYPE public.social_publication_status AS ENUM (
      'queued',
      'validating',
      'generating',
      'asset_ready',
      'publishing',
      'published',
      'failed'
    );
  END IF;
END $$;

-- 2. Criação da tabela social_publications
CREATE TABLE IF NOT EXISTS public.social_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  networks text[] NOT NULL DEFAULT ARRAY[]::text[],
  status public.social_publication_status NOT NULL DEFAULT 'queued'::public.social_publication_status,
  canva_job_id text,
  supabase_image_url text,
  meta_post_ids jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_log text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Índices de performance
CREATE INDEX IF NOT EXISTS idx_social_publications_news_id ON public.social_publications(news_id);
CREATE INDEX IF NOT EXISTS idx_social_publications_status ON public.social_publications(status);
CREATE INDEX IF NOT EXISTS idx_social_publications_created_at ON public.social_publications(created_at DESC);

-- 4. Função e trigger para manter updated_at atualizado
CREATE OR REPLACE FUNCTION public.set_social_publications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_social_publications_updated_at ON public.social_publications;
CREATE TRIGGER trg_social_publications_updated_at
  BEFORE UPDATE ON public.social_publications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_social_publications_updated_at();

-- 5. Habilitação de RLS (Row Level Security)
ALTER TABLE public.social_publications ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de Segurança (Admin Full Access)
DROP POLICY IF EXISTS "Admin full access on social_publications" ON public.social_publications;

CREATE POLICY "Admin full access on social_publications"
ON public.social_publications
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'email' = 'redenortedoparana@gmail.com')
  OR ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
)
WITH CHECK (
  (auth.jwt() ->> 'email' = 'redenortedoparana@gmail.com')
  OR ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
);

-- 7. Configuração do Supabase Realtime
ALTER TABLE public.social_publications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'social_publications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_publications;
  END IF;
END $$;
