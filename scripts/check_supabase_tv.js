const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const root = path.join(__dirname, '..');
  const envFiles = [path.join(root, '.env.local'), path.join(root, '.env')];
  const env = {};
  for (const f of envFiles) {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eq = trimmed.indexOf('=');
        if (eq !== -1) {
          const k = trimmed.slice(0, eq).trim();
          let v = trimmed.slice(eq + 1).trim();
          v = v.replace(/^['"]|['"]$/g, '');
          if (!env[k]) env[k] = v;
        }
      });
    }
  }
  return env;
}

const env = loadEnv();
console.log('SUPABASE URL:', env.NEXT_PUBLIC_SUPABASE_URL);

const supa = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supa
    .from('site_settings')
    .select('*')
    .eq('key', 'tv_channel_settings')
    .maybeSingle();

  if (error) {
    console.error('Supabase error:', error);
    return;
  }
  console.log('Current tv_channel_settings:');
  console.log(JSON.stringify(data, null, 2));
}

run();
