/**
 * Servidor de Transmissão Local para TV Rede Apucarana
 * Integração: MediaMTX (RTMP/HLS Local) + Cloudflare Tunnel (HTTPS Público Gratuito) + Supabase
 *
 * Como funciona:
 * 1. Inicia o MediaMTX localmente (RTMP na porta 1935, HLS na porta 8888 com CORS liberado).
 * 2. Inicia o Cloudflare Tunnel apontando para http://localhost:8888.
 * 3. Captura automaticamente o endereço HTTPS público gerado (https://xxxx.trycloudflare.com).
 * 4. Atualiza no Supabase o link live_m3u8_url para a rota /live/tvapucarana/index.m3u8.
 * 5. Notifica o site (/tv-online) em tempo real via Supabase Broadcast.
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const projectRoot = path.resolve(__dirname, '..');
const mediamtxExe = path.join(__dirname, 'mediamtx.exe');
const mediamtxYml = path.join(__dirname, 'mediamtx.yml');
const cloudflaredExe = path.join(__dirname, 'cloudflared.exe');

// 1. Carrega variáveis de ambiente (.env.local ou .env)
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  const env = {};
  for (const file of envFiles) {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const k = trimmed.slice(0, eqIdx).trim();
          let v = trimmed.slice(eqIdx + 1).trim();
          v = v.replace(/^['"]|['"]$/g, '');
          if (!env[k]) env[k] = v;
        }
      });
    }
  }
  return env;
}

const env = loadEnv();
const supaUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://mrbgxfpxubjodgmcrtuq.supabase.co';
const supaKey =
  env['SUPABASE_SERVICE_ROLE_KEY'] ||
  env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] ||
  env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = supaUrl && supaKey ? createClient(supaUrl, supaKey) : null;

// 2. Encerra instâncias anteriores para liberar as portas 1935 e 8888
function killPreviousProcesses() {
  try {
    execSync('taskkill /F /IM mediamtx.exe /T 2>nul');
  } catch {}
  try {
    execSync('taskkill /F /IM cloudflared.exe /T 2>nul');
  } catch {}
}

killPreviousProcesses();

console.clear();
console.log('='.repeat(78));
console.log('  🚀 INICIANDO SERVIDOR DE TV REDE APUCARANA (MEDIAMTX + CLOUDFLARE)...');
console.log('='.repeat(78));

// 3. Inicia o MediaMTX
const mtxProcess = spawn(mediamtxExe, [mediamtxYml], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe'],
});

mtxProcess.stdout.on('data', (data) => {
  const line = data.toString();
  if (line.includes('is publishing to path')) {
    console.log('\n🔴 [OBS CONECTADO!] Sinal de vídeo e áudio ao vivo recebido do estúdio!');
  } else if (line.includes('closed:') && line.includes('path')) {
    console.log('\n⚪ [OBS DESCONECTADO] O sinal do OBS foi encerrado. O site volta à Grade YouTube.');
  }
});

mtxProcess.stderr.on('data', (data) => {
  const line = data.toString();
  if (line.includes('ERR')) {
    console.error('[MediaMTX Erro]:', line.trim());
  }
});

mtxProcess.on('error', (err) => {
  console.error('[Erro fatal ao iniciar MediaMTX]:', err.message);
  process.exit(1);
});

// 4. Inicia o Cloudflare Tunnel
const cfProcess = spawn(
  cloudflaredExe,
  ['tunnel', '--url', 'http://localhost:8888'],
  {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
  }
);

let capturedPublicUrl = null;

async function onTunnelReady(publicUrl) {
  capturedPublicUrl = publicUrl;
  const m3u8Url = `${publicUrl}/live/tvapucarana/index.m3u8`;

  console.log('\n' + '='.repeat(78));
  console.log('  ✅ SERVIDOR DE TV REDE APUCARANA ATIVO! (100% GRATUITO)');
  console.log('='.repeat(78));
  console.log('  🎥 CONFIGURE SEU OBS STUDIO (Configurações -> Transmissão):');
  console.log('     • Serviço:              Personalizado (Custom)');
  console.log('     • Servidor:             rtmp://localhost:1935/live');
  console.log('     • Chave de Transmissão: tvapucarana');
  console.log('-'.repeat(78));
  console.log('  🌐 LINK PÚBLICO HTTPS HLS (Gerado pelo Cloudflare Tunnel):');
  console.log(`     • ${m3u8Url}`);
  console.log('-'.repeat(78));

  // 5. Atualiza no Supabase
  if (supabase) {
    try {
      // Busca configuração existente
      const { data: existing } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'tv_channel_settings')
        .maybeSingle();

      let currentSettings = {
        mode: 'auto',
        live_program_title: '🔴 AO VIVO: Jornalismo & Giro Rede Apucarana',
      };

      if (existing && existing.value) {
        try {
          const parsed =
            typeof existing.value === 'string'
              ? JSON.parse(existing.value)
              : existing.value;
          if (parsed && typeof parsed === 'object') {
            currentSettings = { ...currentSettings, ...parsed };
          }
        } catch {}
      }

      currentSettings.live_m3u8_url = m3u8Url;
      currentSettings.updated_at = new Date().toISOString();

      const { error: upsertErr } = await supabase.from('site_settings').upsert(
        {
          key: 'tv_channel_settings',
          value: JSON.stringify(currentSettings),
        },
        { onConflict: 'key' }
      );

      if (upsertErr) {
        console.warn('  ⚠️ Aviso: Falha ao salvar no Supabase:', upsertErr.message);
      } else {
        console.log('  ⚡ SINCRONIZAÇÃO AUTOMÁTICA:');
        console.log('     • Link M3U8 salvo no banco Supabase com sucesso!');
        console.log('     • Página pública (/tv-online) conectada a este túnel.');
      }

      // Notifica clientes em tempo real
      const channel = supabase.channel('tv_channel_realtime_sync');
      await channel.send({
        type: 'broadcast',
        event: 'tv_updated',
        payload: { live_m3u8_url: m3u8Url, timestamp: Date.now() },
      });
      supabase.removeChannel(channel);
    } catch (dbErr) {
      console.warn('  ⚠️ Falha ao sincronizar com Supabase:', dbErr.message);
    }
  } else {
    console.log('  ℹ️ Supabase não configurado localmente. Link M3U8 disponível acima.');
  }

  console.log('='.repeat(78));
  console.log('  🟢 TUDO PRONTO! Abra o OBS Studio e clique em "Iniciar Transmissão".');
  console.log('  🛑 Para desligar o servidor, pressione CTRL + C nesta janela.');
  console.log('='.repeat(78) + '\n');
}

function handleTunnelOutput(data) {
  if (capturedPublicUrl) return;
  const text = data.toString();
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match) {
    onTunnelReady(match[0]);
  }
}

cfProcess.stdout.on('data', handleTunnelOutput);
cfProcess.stderr.on('data', handleTunnelOutput);

cfProcess.on('error', (err) => {
  console.error('[Erro fatal ao iniciar Cloudflared]:', err.message);
  process.exit(1);
});

// Limpeza limpa ao fechar
function shutdown() {
  console.log('\n🛑 Encerrando MediaMTX e Cloudflare Tunnel...');
  try {
    mtxProcess.kill('SIGINT');
  } catch {}
  try {
    cfProcess.kill('SIGINT');
  } catch {}
  setTimeout(() => {
    killPreviousProcesses();
    process.exit(0);
  }, 1000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', () => {
  killPreviousProcesses();
});
