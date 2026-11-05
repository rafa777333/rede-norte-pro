import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Credenciais do Supabase não configuradas no ambiente.");
  }
  return createClient(url, key);
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  return res.json();
}

function parseScoreboard(data: any, campNome: string) {
  const events = data?.events || [];
  return events.map((ev: any) => {
    const comp = ev.competitions?.[0] || {};
    const home = comp.competitors?.find((c: any) => c.homeAway === "home") || {};
    const away = comp.competitors?.find((c: any) => c.homeAway === "away") || {};

    const state = ev.status?.type?.state;
    let status = "agendado";
    if (state === "in") status = "ao_vivo";
    else if (state === "post") status = "encerrado";

    let tempo_jogo = ev.status?.type?.shortDetail || ev.status?.type?.detail || "";
    if (status === "ao_vivo") {
      tempo_jogo = ev.status?.displayClock || ev.status?.type?.shortDetail || "Ao vivo";
    } else if (status === "encerrado") {
      tempo_jogo = "Fim";
    } else {
      const dt = new Date(ev.date);
      tempo_jogo = dt.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
    }

    const roundNote = comp.notes?.[0]?.headline || "";
    const rodada = roundNote || (comp.round ? `Rodada ${comp.round}` : "");

    return {
      id: String(ev.id),
      campeonato: campNome,
      rodada: rodada,
      data_jogo: ev.date,
      status: status,
      tempo_jogo: tempo_jogo,
      time_casa_nome: home.team?.displayName || home.team?.name || "Mandante",
      time_casa_sigla: home.team?.abbreviation || "",
      time_casa_escudo: home.team?.logo || "",
      placar_casa: parseInt(home.score || "0", 10),
      time_fora_nome: away.team?.displayName || away.team?.name || "Visitante",
      time_fora_sigla: away.team?.abbreviation || "",
      time_fora_escudo: away.team?.logo || "",
      placar_fora: parseInt(away.score || "0", 10),
      updated_at: new Date().toISOString(),
    };
  });
}

function parseStandings(data: any, campNome: string, campKey: string) {
  const entries = data?.children?.[0]?.standings?.entries || [];
  return entries.map((entry: any) => {
    const stats = entry.stats || [];
    const getStat = (name: string) => {
      const s = stats.find((item: any) => item.name === name);
      return s ? parseInt(s.value || s.displayValue || "0", 10) : 0;
    };

    const teamNome = entry.team?.displayName || entry.team?.name || "Time";
    const teamSlug = teamNome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_");
    const id = `${campKey}_${teamSlug}`;

    return {
      id: id,
      campeonato: campNome,
      posicao: getStat("rank") || 1,
      time_nome: teamNome,
      time_escudo: entry.team?.logos?.[0]?.href || "",
      pontos: getStat("points"),
      jogos: getStat("gamesPlayed"),
      vitorias: getStat("wins"),
      empates: getStat("ties"),
      derrotas: getStat("losses"),
      saldo_gols: getStat("pointDifferential"),
      updated_at: new Date().toISOString(),
    };
  });
}

function getBrasiliaDates() {
  const dates = [];
  const now = new Date();
  const brDateStr = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const [year, month, day] = brDateStr.split("-").map(Number);
  const baseDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  for (let offset = -2; offset <= 3; offset++) {
    const d = new Date(baseDate.getTime() + offset * 86400000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dayStr = String(d.getUTCDate()).padStart(2, "0");
    dates.push(`${y}${m}${dayStr}`);
  }
  return dates;
}

export async function runFootballSync() {
  const supa = getSupabaseAdmin();
  const dates = getBrasiliaDates();

  const leagues = [
    { key: "bra.1", name: "Brasileirão Série A" },
    { key: "bra.2", name: "Brasileirão Série B" },
    { key: "bra.copa_do_brazil", name: "Copa do Brasil" },
    { key: "conmebol.libertadores", name: "Libertadores" },
  ];

  const gamesMap = new Map<string, any>();

  for (const l of leagues) {
    // 1. Fetch default (current/featured)
    try {
      const defaultUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${l.key}/scoreboard`;
      const defData = await fetchJson(defaultUrl);
      const parsedDef = parseScoreboard(defData, l.name);
      for (const g of parsedDef) {
        gamesMap.set(g.id, g);
      }
    } catch (e: any) {
      console.warn(`[ESPN Sync] Falha default ${l.name}:`, e.message);
    }

    // 2. Fetch specific dates in sliding window
    for (const dt of dates) {
      try {
        const dateUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${l.key}/scoreboard?dates=${dt}`;
        const dtData = await fetchJson(dateUrl);
        const parsed = parseScoreboard(dtData, l.name);
        for (const g of parsed) {
          gamesMap.set(g.id, g);
        }
      } catch (e: any) {
        console.warn(`[ESPN Sync] Falha ${l.name} em ${dt}:`, e.message);
      }
    }
  }

  const allGames = Array.from(gamesMap.values());
  let gamesUpserted = 0;

  if (allGames.length > 0) {
    const { error: errGames } = await supa
      .from("futebol_jogos")
      .upsert(allGames, { onConflict: "id" });
    if (errGames) {
      console.error("[ESPN Sync] Erro ao gravar futebol_jogos:", errGames);
    } else {
      gamesUpserted = allGames.length;
    }
  }

  const standingsConfigs = [
    { key: "bra.1", name: "Brasileirão Série A", url: "https://site.api.espn.com/apis/v2/sports/soccer/bra.1/standings" },
    { key: "bra.2", name: "Brasileirão Série B", url: "https://site.api.espn.com/apis/v2/sports/soccer/bra.2/standings" },
  ];

  let allStandings: any[] = [];
  for (const st of standingsConfigs) {
    try {
      const data = await fetchJson(st.url);
      const parsed = parseStandings(data, st.name, st.key);
      allStandings = allStandings.concat(parsed);
    } catch (e: any) {
      console.warn(`[ESPN Sync] Falha standings ${st.name}:`, e.message);
    }
  }

  let standingsUpserted = 0;
  if (allStandings.length > 0) {
    const { error: errStandings } = await supa
      .from("futebol_classificacao")
      .upsert(allStandings, { onConflict: "id" });
    if (errStandings) {
      console.error("[ESPN Sync] Erro ao gravar futebol_classificacao:", errStandings);
    } else {
      standingsUpserted = allStandings.length;
    }
  }

  return {
    success: true,
    timestamp: new Date().toISOString(),
    gamesCount: gamesUpserted,
    standingsCount: standingsUpserted,
    dates,
  };
}
