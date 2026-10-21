# Plano — Vídeos e Classificados no Rede Norte

## Vídeos
A tabela `public.videos` guarda título, descrição, cidade, categoria, vídeo, thumbnail, fonte Instagram, matéria relacionada, tipo e status. A home lista os vídeos por cidade, e o painel permite cadastrar, editar e remover cortes próprios ou links públicos do Instagram.

Cada vídeo possui uma página individual em `/videos/:id` com player vertical, compartilhamento nativo, cópia do link, WhatsApp e matéria relacionada. A página entrega metadados Open Graph no servidor e uma imagem social automática quando não existe thumbnail.

## Compras e Vendas
A aba agora oferece um formulário público com título, cidade, categoria, valor, contato, descrição e foto de até 1,5 MB. O anúncio é gravado na tabela `classified_ads` com `status = pending` e não aparece para o público antes da revisão.

No `/admin`, os envios aparecem marcados como `AGUARDANDO APROVAÇÃO`. Ao editar e salvar, o painel grava o anúncio como `published`, movendo a publicação para a listagem pública. O banco permite inserção anônima somente quando o status enviado é `pending`; visitantes não recebem permissão para editar, publicar ou excluir anúncios.

## Estrutura
- `app/page.tsx`: galeria, formulário público e envio moderado.
- `app/admin/page.tsx`: revisão, aprovação, edição e exclusão.
- `app/globals.css`: layout do formulário e estados de sucesso.
- `supabase/migrations/`: políticas e estrutura persistente.
