# Plano — Vídeos no Rede Norte

## Objetivo
Adicionar uma aba pública de vídeos curtos e um cadastro manual no painel `/admin`, mantendo suporte a arquivos enviados e a links públicos do Instagram.

## Implementação
- Criar a tabela `public.videos` no Supabase com título, descrição, cidade, categoria, vídeo, thumbnail, fonte Instagram, matéria relacionada, tipo e status.
- Adicionar a aba **Vídeos** na home, com filtro por cidade e cards responsivos.
- Reproduzir arquivos próprios com o player HTML5 e links públicos do Instagram em embed dentro do site, com fallback para abrir a publicação original.
- Adicionar no `/admin` o cadastro, upload manual de vídeo, thumbnail, edição, exclusão, cidade, categoria e publicação.
- Reutilizar o bucket público `rede-norte-media` para os arquivos.

## Estrutura
- `app/page.tsx`: consulta e renderização da aba pública.
- `app/admin/page.tsx`: cadastro e gerenciamento.
- `app/globals.css`: visual dos cards, players e formulário.
- `supabase/migrations/`: definição persistente da tabela de vídeos.
