import React from "react";
import type { Metadata } from "next";
import { getHoroscopoDoDia, type SignoPrevisao } from "../../lib/horoscope";
import { getSupabase } from "../../lib/supabase";
import HoroscopoClient from "./HoroscopoClient";

export const revalidate = 60; // ISR - revalidação inteligente a cada 60 segundos

export const metadata: Metadata = {
  title: "Horóscopo do Dia | Previsões dos 12 Signos do Zodíaco | Rede Apucarana",
  description:
    "Confira as previsões diárias dos 12 signos do zodíaco com amor, trabalho, finanças, conselho do dia e números da sorte na Rede Apucarana de Comunicação.",
  alternates: {
    canonical: "https://www.redeapucarana.com.br/horoscopo",
  },
  openGraph: {
    title: "Horóscopo do Dia | Previsões dos Signos | Rede Apucarana",
    description:
      "Previsões diárias completas para todos os signos do zodíaco com conselho do dia, números da sorte e vibrações dos astros.",
    url: "https://www.redeapucarana.com.br/horoscopo",
    siteName: "Rede Apucarana de Comunicação",
    locale: "pt_BR",
    type: "website",
  },
};

export default async function HoroscopoPage() {
  let signos: SignoPrevisao[] = getHoroscopoDoDia();

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "horoscopo_diario")
        .maybeSingle();

      if (data?.value) {
        const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
        signos = getHoroscopoDoDia(parsed);
      }
    }
  } catch (err) {
    console.warn("[HoroscopoPage] Falha ao carregar horóscopo do Supabase:", err);
  }

  const hoje = new Date();
  const dataHoje = hoje.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return <HoroscopoClient initialSignos={signos} dataHoje={dataHoje} />;
}
