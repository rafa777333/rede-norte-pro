# Plano — Upgrade visual do Rede Norte

## Capa jornalística
A notícia principal usa a imagem inteira como capa, com degradê escuro, selo editorial, cidade, categoria, título forte, resumo e CTA. Filtros, Supabase, n8n, painel e rotas permanecem inalterados.

## Faixa regional automática
A faixa superior agora exibe `REDE NORTE DO PARANÁ · CONECTANDO TODO O VALE DO IVAÍ`, data e hora locais atualizadas pelo navegador e um slide meteorológico das localidades atendidas pelo portal. As coordenadas das cidades são consultadas em lote na Open-Meteo, a previsão troca a cada 5,5 segundos e é atualizada a cada 15 minutos.

Se o serviço meteorológico falhar, a faixa permanece organizada e mostra `Atualizando previsão`, sem bloquear notícias ou navegação. A solução não usa plugin, não exige chave e não interfere no n8n ou no Supabase.
