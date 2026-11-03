const http = require("http");
const https = require("https");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Carrega variáveis do .env.local
const envPath = path.resolve(__dirname, "../.env.local");
let webhookUrlFromEnv = "";
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mrbgxfpxubjodgmcrtuq.supabase.co";
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  const matchWebhook = content.match(/N8N_WEBHOOK_URL=(.+)/);
  if (matchWebhook) webhookUrlFromEnv = matchWebhook[1].trim();

  const matchUrl = content.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  if (matchUrl) supabaseUrl = matchUrl[1].trim();

  const matchKey = content.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  if (matchKey) serviceRoleKey = matchKey[1].trim();
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function dispararTeste() {
  console.log("==========================================================");
  console.log("   SIMULAÇÃO DE DISPARO DE TESTE - N8N SOCIAL WEBHOOK     ");
  console.log("==========================================================");

  // 1. Busca notícia existente no banco ou usa payload de teste
  const { data: newsItem } = await supabase
    .from("news")
    .select("id, titulo, imagem, slug")
    .limit(1)
    .single();

  const newsId = newsItem?.id || "4e84f377-862b-471d-b197-532603127e14";
  const testTitle = newsItem?.titulo || "Novo Centro Tecnológico e Inovação é inaugurado em Apucarana";
  const testImage = newsItem?.imagem || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80";
  const testNetworks = process.argv[2] ? process.argv[2].split(",") : ["facebook", "instagram"];

  // 2. Cria registro real na tabela social_publications com status 'queued'
  const { data: publication, error: dbError } = await supabase
    .from("social_publications")
    .insert({
      news_id: newsId,
      networks: testNetworks,
      status: "queued",
      canva_job_id: null,
      supabase_image_url: null,
      meta_post_ids: {},
      error_log: null,
    })
    .select()
    .single();

  if (dbError || !publication) {
    console.error("❌ Erro ao criar registro na tabela social_publications:", dbError?.message);
    return;
  }

  console.log("✔ Registro criado no Supabase (social_publications):");
  console.log(`   ID da Publicação: ${publication.id}`);
  console.log(`   Status: ${publication.status}`);
  console.log(`   Redes: ${JSON.stringify(publication.networks)}`);

  // 3. Monta o payload exatamente como a API Route /api/social/publish envia
  const payload = {
    publication_id: publication.id,
    news_id: newsId,
    title: testTitle,
    image_url: testImage,
    resumo: "Matéria de teste gerada para validação do webhook n8n integrado ao Carimbo Oficial e Meta.",
    conteudo: "Matéria completa de teste para validação de automação social.",
    slug: newsItem?.slug || "noticia-teste-automacao-social",
    networks: testNetworks,
    created_at: publication.created_at,
  };

  const payloadString = JSON.stringify(payload, null, 2);
  console.log("\n📦 Payload de Teste Gerado:");
  console.log(payloadString);

  // 4. Lista de URLs para tentar o envio
  const targets = [];
  if (webhookUrlFromEnv && webhookUrlFromEnv !== "COLE_AQUI_A_URL_DO_SEU_WEBHOOK" && webhookUrlFromEnv.startsWith("http")) {
    targets.push({ name: ".env.local (URL configurada)", url: webhookUrlFromEnv });
  }
  targets.push({ name: "n8n Test Webhook (Modo Teste / Ouvir Evento)", url: "http://localhost:5678/webhook-test/social-publish" });
  targets.push({ name: "n8n Production Webhook (Modo Ativo / Publicado)", url: "http://localhost:5678/webhook/social-publish" });

  console.log("\n🚀 Disparando POST para os endpoints do n8n...");

  for (const target of targets) {
    try {
      console.log(`\nTentando envio para [${target.name}]: ${target.url}`);
      const res = await postJson(target.url, payload);
      console.log(`👉 Resposta do endpoint [${target.url}]: Status ${res.statusCode}`);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`✅ SUCESSO! O webhook do n8n recebeu os dados! Resposta:`, res.body || "OK");
        return;
      } else if (res.statusCode === 404) {
        console.log(`ℹ Endpoint retornou 404. (No n8n, se estiver testando clique em 'Listen for test event' no nó Webhook, ou ative o workflow para o webhook de produção).`);
      } else {
        console.log(`⚠ Resposta inesperada:`, res.body);
      }
    } catch (e) {
      console.log(`❌ Falha de conexão com [${target.url}]: ${e.message}`);
    }
  }

  console.log("\n----------------------------------------------------------");
  console.log("ℹ DICA PARA CAPTURAR NO N8N:");
  console.log("1. No n8n (http://localhost:5678), abra o workflow importado.");
  console.log("2. Dê um duplo clique no nó 'Webhook - Social Publish'.");
  console.log("3. Clique no botão azul 'Listen for test event' (ou 'Test step').");
  console.log("4. Execute novamente este teste e o n8n capturará o evento imediatamente!");
  console.log("OU");
  console.log("Ative o workflow (mude o toggle para 'Active') no canto superior direito do n8n.");
  console.log("----------------------------------------------------------");
}

function postJson(targetUrl, jsonObject) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const isHttps = parsed.protocol === "https:";
    const transport = isHttps ? https : http;
    const data = JSON.stringify(jsonObject);

    const req = transport.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + (parsed.search || ""),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          "User-Agent": "RedeNortePro-TestScript/1.0",
        },
        timeout: 8000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ statusCode: res.statusCode, body }));
      }
    );

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout de conexão"));
    });
    req.write(data);
    req.end();
  });
}

dispararTeste();
