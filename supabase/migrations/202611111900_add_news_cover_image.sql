-- Migration: 202611111900_add_news_cover_image.sql
-- Adiciona suporte explícito a Foto de Capa (16:9 para Home/Redes) e formato de vídeo (16:9 ou 9:16)

ALTER TABLE public.news ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS video_format TEXT DEFAULT '16:9';

-- Sincroniza cover_image com imagem existente onde imagem já estiver preenchida
UPDATE public.news
SET cover_image = imagem
WHERE cover_image IS NULL AND imagem IS NOT NULL;
