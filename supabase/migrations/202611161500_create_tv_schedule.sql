-- =========================================================================
-- MIGRATION: 202611161500_create_tv_schedule.sql
-- Tabela de Grade Programada da Web TV por Dia da Semana (0 a 6)
-- Suporte a links abertos (YouTube, MP4, links externos) e transição por onEnded
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.tv_schedule (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  youtube_id TEXT DEFAULT '',
  type TEXT DEFAULT 'podcast',
  duration_seconds INT DEFAULT 0,
  day_of_week INT NOT NULL DEFAULT 1 CHECK (day_of_week >= 0 AND day_of_week <= 6),
  sort_order INT NOT NULL DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_tv_schedule_day ON public.tv_schedule (day_of_week);
CREATE INDEX IF NOT EXISTS idx_tv_schedule_active ON public.tv_schedule (active);
CREATE INDEX IF NOT EXISTS idx_tv_schedule_sort ON public.tv_schedule (sort_order ASC);

-- Habilitar RLS
ALTER TABLE public.tv_schedule ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DROP POLICY IF EXISTS "Permitir leitura pública de tv_schedule" ON public.tv_schedule;
CREATE POLICY "Permitir leitura pública de tv_schedule"
  ON public.tv_schedule FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir escrita de tv_schedule para admins" ON public.tv_schedule;
CREATE POLICY "Permitir escrita de tv_schedule para admins"
  ON public.tv_schedule FOR ALL
  USING (true)
  WITH CHECK (true);
