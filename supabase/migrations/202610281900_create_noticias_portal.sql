-- Migration: 202610281900_create_noticias_portal.sql
-- Table: public.noticias_portal

CREATE TABLE IF NOT EXISTS public.noticias_portal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  titulo_seo TEXT NOT NULL,
  slug TEXT NOT NULL,
  resumo_meta TEXT,
  corpo_html TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  imagem_url TEXT,
  credito_imagem TEXT,
  fonte_nome TEXT NOT NULL,
  url_original TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'publicado'
);

CREATE INDEX IF NOT EXISTS noticias_portal_categoria_idx ON public.noticias_portal(categoria);
CREATE INDEX IF NOT EXISTS noticias_portal_status_idx ON public.noticias_portal(status);
CREATE INDEX IF NOT EXISTS noticias_portal_created_at_idx ON public.noticias_portal(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS noticias_portal_slug_uidx ON public.noticias_portal(slug);

ALTER TABLE public.noticias_portal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for noticias_portal" ON public.noticias_portal;
CREATE POLICY "Public read access for noticias_portal" ON public.noticias_portal FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role full access for noticias_portal" ON public.noticias_portal;
CREATE POLICY "Service role full access for noticias_portal" ON public.noticias_portal FOR ALL USING (true);

CREATE OR REPLACE FUNCTION sync_noticias_portal_to_news()
RETURNS TRIGGER AS $$
DECLARE
  existing_news_id UUID;
BEGIN
  SELECT id INTO existing_news_id FROM public.news WHERE fonte = NEW.url_original LIMIT 1;

  IF existing_news_id IS NOT NULL THEN
    UPDATE public.news SET
      titulo = NEW.titulo_seo,
      categoria = NEW.categoria,
      conteudo = NEW.corpo_html,
      resumo = NEW.resumo_meta,
      imagem = NEW.imagem_url,
      cidade_slug = 'geral',
      autor = COALESCE(NEW.credito_imagem, NEW.fonte_nome),
      slug = NEW.slug,
      status = CASE WHEN NEW.status = 'publicado' THEN 'published' ELSE NEW.status END,
      updated_at = now()
    WHERE id = existing_news_id;
  ELSE
    INSERT INTO public.news (
      id,
      titulo,
      categoria,
      conteudo,
      resumo,
      imagem,
      cidade_slug,
      autor,
      fonte,
      slug,
      status,
      published_at
    ) VALUES (
      NEW.id,
      NEW.titulo_seo,
      NEW.categoria,
      NEW.corpo_html,
      NEW.resumo_meta,
      NEW.imagem_url,
      'geral',
      COALESCE(NEW.credito_imagem, NEW.fonte_nome),
      NEW.url_original,
      NEW.slug,
      CASE WHEN NEW.status = 'publicado' THEN 'published' ELSE NEW.status END,
      NEW.created_at
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_noticias_portal_to_news ON public.noticias_portal;
CREATE TRIGGER trg_sync_noticias_portal_to_news
AFTER INSERT OR UPDATE ON public.noticias_portal
FOR EACH ROW EXECUTE FUNCTION sync_noticias_portal_to_news();
