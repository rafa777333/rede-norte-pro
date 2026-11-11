-- ==============================================================================
-- MIGRAÇÃO: Cota Limitada, Escassez (Esgotada) e Destaque Extra para Promoções
-- Guia Onde Ir - Rede Apucarana
-- ==============================================================================

-- 1. Adiciona colunas na tabela onde_ir_places
ALTER TABLE public.onde_ir_places 
ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_text TEXT,
ADD COLUMN IF NOT EXISTS promo_highlight BOOLEAN DEFAULT false;

-- 2. Índice para ordenação prioritária de Destaque Extra e Promoções Ativas
CREATE INDEX IF NOT EXISTS onde_ir_places_promo_idx 
ON public.onde_ir_places(is_active, promo_highlight DESC, promo_active DESC, is_vip DESC, created_at DESC);

-- 3. Inicializa registros existentes que já possuíam promoção cadastrada em active_promo
UPDATE public.onde_ir_places
SET 
  promo_active = COALESCE((active_promo->>'isActive')::boolean, true),
  promo_text = COALESCE(promo_text, active_promo->>'title'),
  promo_highlight = COALESCE((active_promo->>'isHighlight')::boolean, false)
WHERE active_promo IS NOT NULL AND active_promo->>'title' IS NOT NULL;
