-- =========================================================================
-- REDE APUCARANA DE COMUNICAÇÃO: SCHEMA DE VÍDEOS & HUB MULTI-CANAL
-- Tabela: portal_videos (Integração TV Apucarana & RedeCast no YouTube)
-- =========================================================================

CREATE TABLE IF NOT EXISTS portal_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  channel_source TEXT NOT NULL CHECK (channel_source IN ('TV Apucarana', 'RedeCast')),
  category TEXT NOT NULL CHECK (category IN ('RedeCast Episódios', 'Reportagens TV', 'Cortes & Shorts', 'Especial & Música')),
  duration TEXT DEFAULT '10:00',
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'publicado' CHECK (status IN ('publicado', 'rascunho')),
  thumbnail_url TEXT,
  views_count TEXT DEFAULT '1.2k',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance para filtragem rápida por canal, categoria e destaque
CREATE INDEX IF NOT EXISTS idx_portal_videos_channel ON portal_videos (channel_source);
CREATE INDEX IF NOT EXISTS idx_portal_videos_category ON portal_videos (category);
CREATE INDEX IF NOT EXISTS idx_portal_videos_featured ON portal_videos (is_featured);
CREATE INDEX IF NOT EXISTS idx_portal_videos_status ON portal_videos (status);
CREATE INDEX IF NOT EXISTS idx_portal_videos_created ON portal_videos (created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE portal_videos ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (qualquer visitante pode assistir aos vídeos publicados)
DROP POLICY IF EXISTS "Permitir leitura pública de portal_videos" ON portal_videos;
CREATE POLICY "Permitir leitura pública de portal_videos"
  ON portal_videos
  FOR SELECT
  USING (true);

-- Política de inserção e atualização para administradores
DROP POLICY IF EXISTS "Permitir escrita irrestrita para admins portal_videos" ON portal_videos;
CREATE POLICY "Permitir escrita irrestrita para admins portal_videos"
  ON portal_videos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Gatilho para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_portal_videos_modtime()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_portal_videos_updated_at ON portal_videos;
CREATE TRIGGER trigger_portal_videos_updated_at
  BEFORE UPDATE ON portal_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_portal_videos_modtime();

-- Inserção de dados iniciais recomendados (TV Apucarana e RedeCast)
INSERT INTO portal_videos (title, youtube_url, youtube_id, channel_source, category, duration, is_featured, status, views_count)
VALUES
  ('RedeCast #42: Os Bastidores da Política Regional e Eleições no Vale do Ivaí', 'https://www.youtube.com/watch?v=ScMzIvxBSi4', 'ScMzIvxBSi4', 'RedeCast', 'RedeCast Episódios', '1h 14m', true, 'publicado', '8.9k'),
  ('RedeCast #41: Polo Têxtil de Apucarana: Inovação, Empregos e Exportação Mundial', 'https://www.youtube.com/watch?v=jNQXAC9IVRw', 'jNQXAC9IVRw', 'RedeCast', 'RedeCast Episódios', '58m', true, 'publicado', '6.2k'),
  ('TV Apucarana: Obras de Duplicação e Contorno Sul na BR-376 Avançam no Vale', 'https://www.youtube.com/watch?v=L_LUpnjgPso', 'L_LUpnjgPso', 'TV Apucarana', 'Reportagens TV', '8:45', true, 'publicado', '14.2k'),
  ('TV Apucarana: Operação da Polícia Militar Resulta em Prisão e Apreensão Recorde', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ', 'fJ9rUzIMcZQ', 'TV Apucarana', 'Reportagens TV', '5:20', true, 'publicado', '19.5k'),
  ('Corte RedeCast: O erro que quase quebrou minha confecção nos primeiros meses', 'https://www.youtube.com/shorts/5O43PjBwT4Q', '5O43PjBwT4Q', 'RedeCast', 'Cortes & Shorts', '0:59', false, 'publicado', '24.1k'),
  ('Flagrante TV Apucarana: Perseguição em Alta Velocidade na Rodovia em Arapongas', 'https://www.youtube.com/shorts/3jz_zV0T4_8', '3jz_zV0T4_8', 'TV Apucarana', 'Cortes & Shorts', '0:45', false, 'publicado', '42.8k'),
  ('Especial Sertanejo: Acústico ao Vivo com Duplas do Vale do Ivaí no Estúdio', 'https://www.youtube.com/watch?v=RgKAFK5djSk', 'RgKAFK5djSk', 'TV Apucarana', 'Especial & Música', '24:18', true, 'publicado', '9.5k')
ON CONFLICT DO NOTHING;
