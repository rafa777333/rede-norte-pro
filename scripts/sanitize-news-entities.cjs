const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Carregar variáveis de ambiente do .env.local
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
  console.error('ERRO: Supabase URL ou Chave não configuradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Decodifica entidades numéricas decimais, hexadecimais e nomeadas do HTML.
 */
function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';

  let decoded = str;

  // Normalizar casos de dupla codificação como &amp;#231;
  decoded = decoded.replace(/&amp;#/gi, '&#');

  // 1. Entidades numéricas decimais (ex: &#231; -> ç, &#8211; -> –)
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) => {
    try {
      const code = parseInt(dec, 10);
      return code > 0 ? String.fromCodePoint(code) : _;
    } catch {
      return _;
    }
  });

  // 2. Entidades numéricas hexadecimais (ex: &#xE7; -> ç, &#x2013; -> –)
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try {
      const code = parseInt(hex, 16);
      return code > 0 ? String.fromCodePoint(code) : _;
    } catch {
      return _;
    }
  });

  // 3. Entidades nomeadas do português e HTML padrão
  const namedEntities = {
    '&quot;': '"',
    '&apos;': "'",
    '&#039;': "'",
    '&#39;': "'",
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&lsquo;': '‘',
    '&rsquo;': '’',
    '&ldquo;': '“',
    '&rdquo;': '”',
    '&sbquo;': '‚',
    '&bdquo;': '„',
    '&hellip;': '…',
    '&bull;': '•',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&ordf;': 'ª',
    '&ordm;': 'º',
    '&deg;': '°',
    '&sect;': '§',
    '&middot;': '·',
    '&aacute;': 'á', '&Aacute;': 'Á',
    '&agrave;': 'à', '&Agrave;': 'À',
    '&atilde;': 'ã', '&Atilde;': 'Ã',
    '&acirc;': 'â', '&Acirc;': 'Â',
    '&auml;': 'ä', '&Auml;': 'Ä',
    '&eacute;': 'é', '&Eacute;': 'É',
    '&egrave;': 'è', '&Egrave;': 'È',
    '&ecirc;': 'ê', '&Ecirc;': 'Ê',
    '&iacute;': 'í', '&Iacute;': 'Í',
    '&igrave;': 'ì', '&Igrave;': 'Ì',
    '&icirc;': 'î', '&Icirc;': 'Î',
    '&oacute;': 'ó', '&Oacute;': 'Ó',
    '&ograve;': 'ò', '&Ograve;': 'Ò',
    '&otilde;': 'õ', '&Otilde;': 'Õ',
    '&ocirc;': 'ô', '&Ocirc;': 'Ô',
    '&uacute;': 'ú', '&Uacute;': 'Ú',
    '&ugrave;': 'ù', '&Ugrave;': 'Ù',
    '&ucirc;': 'û', '&Ucirc;': 'Û',
    '&uuml;': 'ü', '&Uuml;': 'Ü',
    '&ccedil;': 'ç', '&Ccedil;': 'Ç'
  };

  for (const [entity, replacement] of Object.entries(namedEntities)) {
    decoded = decoded.replace(new RegExp(entity, 'gi'), replacement);
  }

  // 4. Última limpeza de &amp; restante (se não for parte de outra entidade)
  decoded = decoded.replace(/&amp;/gi, '&');

  return decoded;
}

async function sanitizeDatabase() {
  console.log('--- Iniciando sanitização de entidades HTML e imagens no Supabase ---');

  // 1. Sanitizar tabela 'news'
  const { data: allNews, error } = await supabase
    .from('news')
    .select('id, slug, titulo, resumo, conteudo, imagem')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar notícias da tabela news:', error);
  } else {
    console.log(`Total de notícias na tabela news: ${allNews.length}`);
    let updatedCount = 0;

    for (const item of allNews) {
      const rawTitulo = item.titulo || '';
      const rawResumo = item.resumo || '';
      const rawConteudo = item.conteudo || '';
      const rawImagem = item.imagem || '';

      const cleanTitulo = decodeHtmlEntities(rawTitulo);
      const cleanResumo = decodeHtmlEntities(rawResumo);
      const cleanConteudo = decodeHtmlEntities(rawConteudo);
      let cleanImagem = rawImagem;
      if (cleanImagem && cleanImagem.startsWith('http://')) {
        cleanImagem = 'https://' + cleanImagem.slice(7);
      }

      const changed =
        cleanTitulo !== rawTitulo ||
        cleanResumo !== rawResumo ||
        cleanConteudo !== rawConteudo ||
        cleanImagem !== rawImagem;

      if (changed) {
        console.log(`Atualizando [${item.slug}]:`);
        if (cleanTitulo !== rawTitulo) console.log(`  Titulo: "${rawTitulo}" -> "${cleanTitulo}"`);
        if (cleanResumo !== rawResumo) console.log(`  Resumo: corrigido`);
        if (cleanConteudo !== rawConteudo) console.log(`  Conteudo: corrigido`);
        if (cleanImagem !== rawImagem) console.log(`  Imagem: "${rawImagem}" -> "${cleanImagem}"`);

        const { error: updateError } = await supabase
          .from('news')
          .update({
            titulo: cleanTitulo,
            resumo: cleanResumo,
            conteudo: cleanConteudo,
            imagem: cleanImagem,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (updateError) {
          console.error(`Erro ao atualizar notícia ${item.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }
    console.log(`Total de notícias corrigidas na tabela news: ${updatedCount}`);
  }

  // 2. Sanitizar tabela 'noticias_portal'
  const { data: portalNews, error: portalErr } = await supabase
    .from('noticias_portal')
    .select('id, slug, titulo, resumo_meta, conteudo, imagem, imagem_url')
    .limit(500);

  if (portalErr) {
    console.log('Tabela noticias_portal não encontrada ou inacessível:', portalErr.message);
  } else if (portalNews && portalNews.length > 0) {
    console.log(`Total de notícias na tabela noticias_portal: ${portalNews.length}`);
    let portalUpdated = 0;

    for (const item of portalNews) {
      const rawTitulo = item.titulo || '';
      const rawResumo = item.resumo_meta || '';
      const rawConteudo = item.conteudo || '';
      let cleanImg = item.imagem_url || item.imagem || '';
      if (cleanImg && cleanImg.startsWith('http://')) {
        cleanImg = 'https://' + cleanImg.slice(7);
      }

      const cleanTitulo = decodeHtmlEntities(rawTitulo);
      const cleanResumo = decodeHtmlEntities(rawResumo);
      const cleanConteudo = decodeHtmlEntities(rawConteudo);

      const changed =
        cleanTitulo !== rawTitulo ||
        cleanResumo !== rawResumo ||
        cleanConteudo !== rawConteudo ||
        (cleanImg && cleanImg !== (item.imagem_url || item.imagem));

      if (changed) {
        console.log(`Atualizando noticias_portal [${item.slug}]:`);
        const { error: updateError } = await supabase
          .from('noticias_portal')
          .update({
            titulo: cleanTitulo,
            resumo_meta: cleanResumo,
            conteudo: cleanConteudo,
            imagem: cleanImg,
            imagem_url: cleanImg,
          })
          .eq('id', item.id);

        if (updateError) {
          console.error(`Erro ao atualizar noticias_portal ${item.id}:`, updateError);
        } else {
          portalUpdated++;
        }
      }
    }
    console.log(`Total de notícias corrigidas na tabela noticias_portal: ${portalUpdated}`);
  }

  console.log(`\n=== SANITIZAÇÃO CONCLUÍDA COM SUCESSO ===`);
}

sanitizeDatabase();
