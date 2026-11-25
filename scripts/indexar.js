#!/usr/bin/env node

/**
 * Script CLI: indexar.js
 * Força o envio imediato de URLs para a Google Indexing API e reenvio de sitemap no Search Console.
 * 
 * Uso:
 *   node scripts/indexar.js <url_ou_slug> [--delete]
 * 
 * Exemplos:
 *   node scripts/indexar.js https://www.redeapucarana.com.br/noticia/minha-materia
 *   node scripts/indexar.js /noticia/vacina-da-gripe-em-apucarana
 *   node scripts/indexar.js minha-materia
 *   node scripts/indexar.js https://www.redeapucarana.com.br/empregos
 *   node scripts/indexar.js https://www.redeapucarana.com.br/noticia/materia-antiga --delete
 */

const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const DEFAULT_BASE_URL = "https://www.redeapucarana.com.br";

// 1. Carrega variáveis de ambiente do .env.local caso não estejam no process.env
function loadEnvLocal() {
  const possiblePaths = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(__dirname, "../.env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "../.env"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, "utf8");
        const lines = raw.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line || line.startsWith("#")) continue;

          const eqIdx = line.indexOf("=");
          if (eqIdx === -1) continue;

          const key = line.slice(0, eqIdx).trim();
          let val = line.slice(eqIdx + 1).trim();

          // Se for chave multiline com aspas
          if (val.startsWith('"') && !val.endsWith('"')) {
            let multilineVal = val.slice(1);
            i++;
            while (i < lines.length) {
              const nextLine = lines[i];
              if (nextLine.endsWith('"')) {
                multilineVal += "\n" + nextLine.slice(0, -1);
                break;
              } else {
                multilineVal += "\n" + nextLine;
              }
              i++;
            }
            val = multilineVal;
          } else if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }

          if (!process.env[key] && val) {
            process.env[key] = val;
          }
        }
      } catch (e) {
        console.warn(`[Aviso] Falha ao ler ${p}:`, e.message);
      }
    }
  }
}

loadEnvLocal();

// 2. Normaliza URL recebida
function normalizeTargetUrl(input) {
  if (!input) return null;
  let str = input.trim();

  // Flag ou argumento
  if (str.startsWith("-")) return null;

  if (str.startsWith("http://") || str.startsWith("https://")) {
    return str;
  }
  if (str.startsWith("/")) {
    return `${DEFAULT_BASE_URL}${str}`;
  }
  if (str.includes("redeapucarana.com.br")) {
    return `https://${str}`;
  }
  // Se for apenas o slug da matéria
  return `${DEFAULT_BASE_URL}/noticia/${encodeURIComponent(str)}`;
}

async function run() {
  const args = process.argv.slice(2);
  const isDelete = args.includes("--delete") || args.includes("-d");
  const urlArg = args.find((a) => !a.startsWith("-"));

  console.log("=============================================================");
  console.log(" 🚀 REDE APUCARANA - GOOGLE INDEXING & SEARCH CONSOLE CLI   ");
  console.log("=============================================================\n");

  if (!urlArg) {
    console.error("❌ Erro: Nenhuma URL ou slug fornecido para indexação.\n");
    console.log("📖 Formato de Uso:");
    console.log("   node scripts/indexar.js <url_ou_slug> [--delete]\n");
    console.log("💡 Exemplos Práticos:");
    console.log("   node scripts/indexar.js https://www.redeapucarana.com.br/noticia/minha-materia");
    console.log("   node scripts/indexar.js /noticia/vacina-da-gripe-em-apucarana");
    console.log("   node scripts/indexar.js https://www.redeapucarana.com.br/empregos");
    console.log("   node scripts/indexar.js minha-materia-slug");
    console.log("   node scripts/indexar.js /noticia/materia-antiga --delete\n");
    process.exit(1);
  }

  const targetUrl = normalizeTargetUrl(urlArg);
  const actionType = isDelete ? "URL_DELETED" : "URL_UPDATED";

  console.log(`🎯 URL Alvo:  ${targetUrl}`);
  console.log(`📌 Operação:  ${actionType}\n`);

  // 3. Validação de Credenciais
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.trim();

  if (!clientEmail || !privateKey) {
    console.error("❌ ERRO DE CONFIGURAÇÃO: Credenciais da Service Account do Google não encontradas!");
    console.error("👉 Configure as variáveis no seu arquivo .env.local:");
    console.error("   GOOGLE_CLIENT_EMAIL=seu-servico@seu-projeto.iam.gserviceaccount.com");
    console.error('   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
    console.error("   GOOGLE_SEARCH_CONSOLE_SITE_URL=https://www.redeapucarana.com.br/\n");
    process.exit(1);
  }

  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, "\n");

  // 4. Criação do cliente de autenticação
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/indexing",
      "https://www.googleapis.com/auth/webmasters",
    ],
  });

  let indexingSuccess = false;

  // 5. Google Indexing API
  console.log("⏳ Enviando notificação para Google Indexing API...");
  try {
    const indexing = google.indexing({ version: "v3", auth });
    const res = await indexing.urlNotifications.publish({
      requestBody: {
        url: targetUrl,
        type: actionType,
      },
    });

    console.log("✅ [Google Indexing API] Notificação enviada com sucesso!");
    console.log("   Status HTTP:", res.status);
    console.log("   Resposta:", JSON.stringify(res.data, null, 2));
    indexingSuccess = true;
  } catch (err) {
    const errMsg = err?.response?.data?.error?.message || err.message;
    console.error("⚠️ [Google Indexing API] Falha ao enviar URL:");
    console.error("   Mensagem:", errMsg);
    if (err?.response?.status) console.error("   Status:", err.response.status);
  }

  // 6. Google Search Console API (Reenvio de Sitemap)
  console.log("\n⏳ Reenviando sitemap para Google Search Console API...");
  const sitemapUrl =
    process.env.NEXT_PUBLIC_SITEMAP_URL || `${DEFAULT_BASE_URL}/sitemap.xml`;
  const siteUrl =
    process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || `${DEFAULT_BASE_URL}/`;

  try {
    const searchconsole = google.searchconsole({ version: "v1", auth });
    const scRes = await searchconsole.sitemaps.submit({
      siteUrl: siteUrl,
      feedpath: sitemapUrl,
    });

    console.log("✅ [Search Console API] Sitemap reenviado com sucesso!");
    console.log("   Propriedade:", siteUrl);
    console.log("   Sitemap:    ", sitemapUrl);
    console.log("   Status HTTP:", scRes.status);
  } catch (err) {
    const errMsg = err?.response?.data?.error?.message || err.message;
    console.warn("⚠️ [Search Console API] Aviso ao reenviar sitemap:");
    console.warn("   Mensagem:", errMsg);
    console.warn("   Nota: Certifique-se de que a Service Account foi adicionada como 'Proprietário' (Owner) na propriedade do Search Console.");
  }

  console.log("\n=============================================================");
  if (indexingSuccess) {
    console.log("🎉 Processo concluído com sucesso para:", targetUrl);
    console.log("=============================================================\n");
    process.exit(0);
  } else {
    console.log("⚠️ Processo finalizado com ressalvas. Verifique os logs acima.");
    console.log("=============================================================\n");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("\n💥 Erro fatal de execução:", err.message);
  process.exit(1);
});
