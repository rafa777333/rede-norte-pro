import fs from "fs";
import path from "path";

const APP_ID = "1067690533086797";
const DEFAULT_PAGE_ID = "117584158034115";
const DEFAULT_IG_ID = "17841462812495678";
const API_VERSION = "v21.0";

function mask(token) {
  if (!token || typeof token !== "string") return "(vazio)";
  const trimmed = token.trim();
  if (trimmed.length <= 8) return "***";
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key) {
      env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

function updateEnvFile(filePath, key, value) {
  let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content = content.trim() + `\n${key}=${value}\n`;
  }
  fs.writeFileSync(filePath, content, "utf8");
}

async function callMeta(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => null);
  if (!res.ok || (data && data.error)) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    const code = data?.error?.code ? ` (código ${data.error.code})` : "";
    throw new Error(`${msg}${code}`);
  }
  return data;
}

async function main() {
  console.log("==================================================================");
  console.log("🚀 REDE APUCARANA — CONFIGURAÇÃO E VALIDAÇÃO DO TOKEN DA META");
  console.log("==================================================================\n");

  const envPath = path.resolve(".env.local");
  const env = loadEnvFile(envPath);

  const appSecret = env.META_APP_SECRET?.trim();
  const tempToken = env.META_TEMP_TOKEN?.trim() || env.META_ACCESS_TOKEN?.trim();
  const pageId = env.FACEBOOK_PAGE_ID?.trim() || DEFAULT_PAGE_ID;
  const igId = env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim() || DEFAULT_IG_ID;

  let activeToken = env.META_ACCESS_TOKEN?.trim();

  // CENÁRIO 1: Usuário informou META_APP_SECRET e META_TEMP_TOKEN (ou META_ACCESS_TOKEN temporário)
  // Fazemos a conversão automática: User Token 1h -> User Token 60 dias -> Page Access Token Permanente
  if (appSecret && tempToken) {
    console.log("🔄 META_APP_SECRET detectado! Iniciando conversão para Token Permanente da Página...");
    console.log(`   App ID: ${APP_ID}`);
    console.log(`   Token de entrada: ${mask(tempToken)}`);

    try {
      // Passo 1: Troca por User Token de 60 dias (Long-Lived User Token)
      console.log("\n1️⃣ Solicitando User Token de longa duração (60 dias)...");
      const exchangeUrl = `https://graph.facebook.com/${API_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${appSecret}&fb_exchange_token=${tempToken}`;
      const exchangeData = await callMeta(exchangeUrl);
      const longLivedUserToken = exchangeData.access_token;
      console.log(`   ✔ User Token de 60 dias gerado: ${mask(longLivedUserToken)}`);

      // Passo 2: Busca o Page Access Token Permanente da Página 117584158034115
      console.log(`\n2️⃣ Solicitando Token Permanente para a Página ID ${pageId}...`);
      let pageAccessToken = null;
      let pageName = "";

      // Tentativa direta pelo nó da página
      try {
        const pageData = await callMeta(
          `https://graph.facebook.com/${API_VERSION}/${pageId}?fields=access_token,name,instagram_business_account&access_token=${longLivedUserToken}`
        );
        pageAccessToken = pageData.access_token;
        pageName = pageData.name || "Rádio e TV Apucarana";
      } catch (errPage) {
        // Fallback: consulta /me/accounts para listar as páginas do usuário
        const accountsData = await callMeta(
          `https://graph.facebook.com/${API_VERSION}/me/accounts?access_token=${longLivedUserToken}`
        );
        const targetPage = accountsData?.data?.find((p) => p.id === pageId);
        if (targetPage) {
          pageAccessToken = targetPage.access_token;
          pageName = targetPage.name;
        } else {
          throw new Error(
            `A página ID ${pageId} não foi encontrada na lista de páginas administradas pelo usuário fornecido. Páginas disponíveis: ${
              accountsData?.data?.map((p) => `${p.name} (${p.id})`).join(", ") || "nenhuma"
            }`
          );
        }
      }

      if (!pageAccessToken) {
        throw new Error("Não foi possível extrair o access_token da Página.");
      }

      console.log(`   ✔ Página identificada: "${pageName}"`);
      console.log(`   ✔ Page Access Token Permanente obtido: ${mask(pageAccessToken)}`);

      // Passo 3: Salva no .env.local
      updateEnvFile(envPath, "META_ACCESS_TOKEN", pageAccessToken);
      console.log(`\n💾 META_ACCESS_TOKEN atualizado automaticamente com sucesso em .env.local!`);
      activeToken = pageAccessToken;
    } catch (exchangeErr) {
      console.error(`\n❌ Falha na geração do token permanente: ${exchangeErr.message}`);
      console.log("   Continuando para testar o token ativo existente...");
    }
  }

  // CENÁRIO 2: Testar e Inspecionar o Token Ativo em META_ACCESS_TOKEN
  if (!activeToken) {
    console.log("\n⚠️ NENHUM META_ACCESS_TOKEN ENCONTRADO NO .env.local.");
    console.log("👉 Adicione seu token no .env.local conforme as instruções e execute este script novamente.\n");
    return;
  }

  console.log("\n------------------------------------------------------------------");
  console.log(`🔍 AUDITORIA DO TOKEN ATIVO: ${mask(activeToken)}`);
  console.log("------------------------------------------------------------------");

  let tokenType = "desconhecido";
  let isValid = false;
  let expiresAtText = "desconhecido";
  let scopes = [];

  // 1. Inspeciona o token via /debug_token (usando App Token ou o próprio token)
  try {
    const debugAuth = appSecret ? `${APP_ID}|${appSecret}` : activeToken;
    const debugData = await callMeta(
      `https://graph.facebook.com/${API_VERSION}/debug_token?input_token=${activeToken}&access_token=${debugAuth}`
    );
    const info = debugData?.data;
    if (info) {
      isValid = Boolean(info.is_valid);
      tokenType = info.type || "desconhecido";
      scopes = info.scopes || [];

      if (info.expires_at === 0) {
        expiresAtText = "🟢 PERMANENTE (Nunca expira — Ideal para produção!)";
      } else if (info.expires_at) {
        const expDate = new Date(info.expires_at * 1000);
        const diasRestantes = Math.round((expDate.getTime() - Date.now()) / (1000 * 3600 * 24));
        if (diasRestantes <= 1) {
          const horas = Math.round((expDate.getTime() - Date.now()) / (1000 * 3600));
          expiresAtText = `🔴 Expira em breve (${horas} horas) — em ${expDate.toLocaleString("pt-BR")}`;
        } else {
          expiresAtText = `🟡 Expira em ${diasRestantes} dias — em ${expDate.toLocaleString("pt-BR")}`;
        }
      }
    }
  } catch (debugErr) {
    // Se debug_token falhar por falta de App Secret, prossegue para testes diretos
  }

  // 2. Teste de Conexão com a Página do Facebook
  let fbOk = false;
  let pageName = "";
  try {
    const pageRes = await callMeta(
      `https://graph.facebook.com/${API_VERSION}/${pageId}?fields=id,name,can_post&access_token=${activeToken}`
    );
    fbOk = true;
    pageName = pageRes.name || "Rádio e TV Apucarana";
  } catch (fbErr) {
    fbOk = false;
    console.log(`   ❌ Erro ao acessar Página do Facebook (${pageId}): ${fbErr.message}`);
  }

  // 3. Teste de Conexão com o Instagram Business
  let igOk = false;
  let igUsername = "";
  try {
    const igRes = await callMeta(
      `https://graph.facebook.com/${API_VERSION}/${igId}?fields=id,username,name&access_token=${activeToken}`
    );
    igOk = true;
    igUsername = igRes.username || "redeapucarana";
  } catch (igErr) {
    igOk = false;
    console.log(`   ❌ Erro ao acessar Instagram (${igId}): ${igErr.message}`);
  }

  // Relatório Final
  console.log(`\n📋 RELATÓRIO DE DIAGNÓSTICO:`);
  console.log(`   • Validade do Token: ${expiresAtText}`);
  console.log(`   • Tipo do Token: ${tokenType.toUpperCase()}`);
  if (scopes.length) {
    console.log(`   • Permissões detectadas: ${scopes.join(", ")}`);
  }
  console.log(`   • Facebook Page: ${fbOk ? `✅ CONECTADO — "${pageName}" (${pageId})` : "❌ NÃO AUTORIZADO"}`);
  console.log(`   • Instagram:     ${igOk ? `✅ CONECTADO — @${igUsername} (${igId})` : "❌ NÃO AUTORIZADO"}`);

  if (fbOk && igOk) {
    console.log("\n🎉 PARABÉNS! A integração com Facebook e Instagram está 100% pronta e operacional.");
    if (expiresAtText.includes("PERMANENTE")) {
      console.log("🌟 Este token é perpétuo: suas publicações funcionarão continuamente sem expirar!");
    }
  } else {
    console.log("\n⚠️ AVISO: O token atual não possui permissões suficientes para ambas as redes.");
    console.log("   Certifique-se de selecionar: pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish.");
  }
  console.log("\n==================================================================\n");
}

main().catch((err) => {
  console.error("Erro inesperado:", err);
  process.exit(1);
});
