# Plano — Automação meteorológica do Rede Norte

O workflow `REDE NORTE - Meteorologia das cidades` consulta a Open-Meteo para as 27 localidades do portal a cada 15 minutos. Ele prepara temperatura, mínima, máxima, código do tempo, condição, coordenadas e horário de atualização; limpa o conjunto anterior e grava o estado atual na tabela `weather_current` do Supabase.

A faixa superior do site consulta primeiro `weather_current`, de modo que passa a consumir os dados centralizados pelo n8n. Se a tabela estiver vazia ou o n8n estiver temporariamente indisponível, a faixa usa a Open-Meteo diretamente como fallback para não deixar o site sem previsão.

O workflow também possui o gatilho manual `GET /webhook/rede-norte-weather` para teste operacional. A API n8n confirmou a criação e ativação do fluxo; a confirmação final de gravação ficou pendente porque o túnel público caiu durante o segundo teste.
