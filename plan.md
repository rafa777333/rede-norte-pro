# Plano — Vídeos no Rede Norte

## Objetivo
Adicionar uma aba pública de vídeos curtos e um cadastro manual no painel `/admin`, com páginas individuais compartilháveis e prévias sociais corretas.

## Implementação
A tabela `public.videos` guarda título, descrição, cidade, categoria, vídeo, thumbnail, fonte Instagram, matéria relacionada, tipo e status. A home lista os vídeos por cidade, e o painel permite cadastrar, editar e remover cortes próprios ou links públicos do Instagram.

Cada vídeo possui uma página individual em `/videos/:id`. Para vídeos enviados ao bucket do Rede Norte, a página usa player vertical próprio. Ela oferece compartilhamento nativo do celular, cópia do link, envio pelo WhatsApp e link da matéria relacionada.

A página individual agora também gera metadados Open Graph no servidor, incluindo `og:title`, `og:description`, `og:url`, `og:image` e Twitter Card. Quando não existe thumbnail, a rota `opengraph-image` cria uma imagem social automática com a identidade da Rede Norte e o título do vídeo. Isso permite que Facebook, WhatsApp e outras redes montem a prévia sem executar JavaScript.

## Estrutura
- `app/page.tsx`: consulta, galeria pública e links das páginas individuais.
- `app/videos/[id]/page.tsx`: metadados sociais no servidor.
- `app/videos/[id]/VideoPageClient.tsx`: player, interface e compartilhamento.
- `app/videos/[id]/opengraph-image.tsx`: imagem social dinâmica.
- `app/admin/page.tsx`: cadastro e gerenciamento.
- `app/globals.css`: visual dos cards, players, página individual e botões.
- `supabase/migrations/`: definição persistente da tabela de vídeos.
