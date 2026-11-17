-- =========================================================================
-- MIGRATION: 202611171855_add_start_time_to_tv_schedule.sql
-- Adiciona suporte a Horário de Início (start_time) no formato 'HH:MM'
-- para programas de horário fixo sincronizados com o horário de Brasília.
-- Se start_time for NULL/vazio, o vídeo funciona como 'Sequência' contínua.
-- =========================================================================

ALTER TABLE IF EXISTS public.tv_schedule
  ADD COLUMN IF NOT EXISTS start_time TEXT DEFAULT NULL;

COMMENT ON COLUMN public.tv_schedule.start_time IS 'Horário de início programado (HH:MM no horário de Brasília). Se NULL, entra na sequência contínua.';
