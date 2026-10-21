# Plano — Vídeos no Rede Norte

## Objetivo
Adicionar uma aba pública de vídeos curtos e um cadastro manual no painel `/admin`, mantendo suporte a arquivos enviados e a links públicos do Instagram.

## Implementação
A tabela `public.videos` guarda título, descrição, cidade, categoria, vídeo, thumbnail, fonte Instagram, matéria relacionada, tipo e status. A home lista os vídeos por cidade, e o painel permite cadastrar, editar e remover cortes próprios ou links públicos do Instagram.

Cada vídeo também possui uma página individual em `/videos/:id`. Para vídeos enviados ao bucket do Rede Norte, essa página usa player vertical próprio. Ela oferece compartilhamento nativo do celular, cópia do link, envio pelo WhatsApp e link da matéria relacionada.

## Estrutura
- `app/page.tsx`: consulta, galeria pública e links das páginas individuais.
- `app/videos/[id]/page.tsx`: player vertical, carregamento do vídeo e compartilhamento.
- `app/admin/page.tsx`: cadastro e gerenciamento.
- `app/globals.css`: visual dos cards, players, página individual e botões.
- `supabase/migrations/`: definição persistente da tabela de vídeos.
