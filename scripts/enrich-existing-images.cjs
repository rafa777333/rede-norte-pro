const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Carregar variáveis de ambiente
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: Supabase URL ou Chave não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function cleanExtractedImage(img, baseUrl) {
  if (!img) return '';
  let clean = img.trim();
  if (clean.startsWith('//')) clean = 'https:' + clean;
  if (!clean.startsWith('http')) {
    try {
      const baseObj = new URL(baseUrl);
      clean = baseObj.origin + (clean.startsWith('/') ? '' : '/') + clean;
    } catch {
      clean = baseUrl.replace(/\/$/, '') + (clean.startsWith('/') ? '' : '/') + clean;
    }
  }

  const lower = clean.toLowerCase();
  if (
    lower.includes('logo') ||
    lower.includes('brasao') ||
    lower.includes('transparencia') ||
    lower.includes('vlibras') ||
    lower.includes('avatar') ||
    lower.includes('placeholder') ||
    lower.includes('selo_diamante') ||
    lower.includes('core/emoji') ||
    lower.endsWith('.svg') ||
    lower.endsWith('.gif')
  ) {
    return '';
  }
  return clean;
}

async function extractOgImageFromUrl(url) {
  if (!url || !url.startsWith('http')) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();

    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);

    if (ogMatch && ogMatch[1]) {
      const cleaned = cleanExtractedImage(ogMatch[1], url);
      if (cleaned) return cleaned;
    }

    // Fallback: tentar primeira imagem de artigo (ex: wp-post-image ou classe de notícia)
    const postImgMatch = html.match(/<img[^>]+class=["'][^"']*(?:wp-post-image|featured|attachment|noticia)[^"']*["'][^>]+src=["']([^"']+)["']/i) ||
                         html.match(/<img[^>]+src=["']([^"']+)["'][^>]+class=["'][^"']*(?:wp-post-image|featured|attachment|noticia)[^"']*["']/i);
    if (postImgMatch && postImgMatch[1]) {
      const cleaned = cleanExtractedImage(postImgMatch[1], url);
      if (cleaned) return cleaned;
    }

    return null;
  } catch (err) {
    return null;
  }
}

async function runEnrichment() {
  console.log('=====================================================');
  console.log('🔍 INICIANDO ENRIQUECIMENTO DE IMAGENS REAIS DAS FONTES');
  console.log('=====================================================');

  // 1. Atualizar especificamente a matéria do IBGE se necessário
  console.log('1. Atualizando matéria do IBGE Apucarana com imagem oficial...');
  const ibgeImg = 'http://www.apucarana.pr.gov.br/site/wp-content/uploads/2026/11/Inscricoes-abertas-para-recenseador-em-Apucarana-e1794923012666.png';
  const { error: ibgeErr } = await supabase
    .from('news')
    .update({ imagem: ibgeImg, updated_at: new Date().toISOString() })
    .ilike('titulo', '%IBGE abre 9 vagas temporárias%');

  if (ibgeErr) {
    console.error('Erro ao atualizar IBGE:', ibgeErr.message);
  } else {
    console.log('✅ Matéria do IBGE atualizada com imagem oficial com sucesso!');
  }

  // 2. Buscar todas as notícias sem foto real
  console.log('\n2. Buscando matérias sem imagem real no banco...');
  const { data: newsToEnrich, error: fetchErr } = await supabase
    .from('news')
    .select('id, titulo, fonte, imagem, cidade_slug')
    .or('imagem.eq./logo-rede-apucarana.png,imagem.is.null,imagem.ilike.%ibge-apucarana%')
    .not('fonte', 'is', null)
    .order('published_at', { ascending: false })
    .limit(300);

  if (fetchErr) {
    console.error('Erro ao buscar notícias:', fetchErr.message);
    return;
  }

  console.log(`Encontradas ${newsToEnrich.length} matérias para enriquecer.`);

  let atualizadas = 0;
  let falhas = 0;

  for (let i = 0; i < newsToEnrich.length; i++) {
    const item = newsToEnrich[i];
    process.stdout.write(`[${i + 1}/${newsToEnrich.length}] [${item.cidade_slug}] ${item.titulo.slice(0, 50)}... `);

    const ogImg = await extractOgImageFromUrl(item.fonte);
    if (ogImg) {
      const { error: upErr } = await supabase
        .from('news')
        .update({ imagem: ogImg, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (upErr) {
        console.log(`❌ Erro no banco: ${upErr.message}`);
        falhas++;
      } else {
        console.log(`✅ Foto encontrada: ${ogImg.slice(0, 60)}...`);
        atualizadas++;
      }
    } else {
      console.log(`⚠️ Sem og:image na página`);
      falhas++;
    }

    // Pequena pausa para evitar bloqueio por taxa
    if (i % 5 === 0) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log('\n=====================================================');
  console.log(`🎉 CONCLUÍDO: ${atualizadas} imagens reais restauradas | ${falhas} sem imagem na fonte.`);
  console.log('=====================================================');
}

runEnrichment();
