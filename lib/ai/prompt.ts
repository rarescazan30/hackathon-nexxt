// System prompt, guardrails, and curated official Romanian knowledge corpus for the AI Agent.
// Follows Golden Rules:
// 1. Every number comes from deterministic code (lib/rules/), never invented by the LLM.
// 2. Every factual claim cites an official Romanian source (ASF, BVB, BNR, INS, CNPP, MF).
// 3. Financial education and scenario simulation, never licensed investment advice (MiFID II).

import type { Chunk } from "../contracts";

export const AGENT_SYSTEM_PROMPT = `Ești asistentul financiar educațional din aplicația „Zile de Libertate” (Rethinking Financial Futures - România).

REGULI DE AUR (STRICTE):
1. NU calcula niciodată sume de bani, procente de alocare, rotunjiri (round-up) sau proiecții din memorie. Folosește EXCLUSIV cifrele returnate de uneltele deterministe (lib/rules).
2. Toate explicațiile sunt în limba română, pe un ton cald, clar, fără jargon bancar inutil.
3. Oferi educație financiară și simulări de scenarii (pesimist / bază / optimist), NU consultanță financiară autorizată. Amintește că decizia finală aparține utilizatorului.
4. Orice afirmație despre pensii, inflație, Pilonul 2/3, ETF BET sau Titluri de Stat trebuie să menționeze sursa oficială (ASF, BVB, BNR, CNPP, INS, Ministerul Finanțelor).
5. Fii concis: maximum 2-3 paragrafe scurte per răspuns, deoarece interfața este mobile-first (lățime 390px).`;

export interface KnowledgeEntry extends Chunk {
  id: string;
  keywords: string[];
}

export const OFFICIAL_KNOWLEDGE_CORPUS: KnowledgeEntry[] = [
  {
    id: "etf-vs-fond",
    keywords: [
      "diferenta",
      "diferența",
      "fond de investitii",
      "fond mutual",
      "fonduri",
      "comisioane",
      "etf si fond",
      "eft",
    ],
    content:
      "Diferența principală dintre un **ETF** (precum ETF BET Patria-Tradeville) și un **fond mutual clasic de investiții** ține de costuri și modul de tranzacționare: (1) **Comisioane mai mici:** un ETF urmărește pasiv indicele bursier și are comisioane anuale mai reduse decât un fond administrat activ la bancă; (2) **Flexibilitate:** unitățile de ETF se cumpără și se vând instant la Bursa de Valori București (BVB) în timpul ședinței de tranzacționare, în timp ce la un fond mutual clasic subscrierea și răscumpărarea se procesează la valoarea unitară de la finalul zilei (VUAN); (3) **Transparență:** știi în fiecare clipă ce companii ai în portofoliu (top 20 companii din indicele BET).",
    sourceTitle: "ASF & BVB — Ghid ETF vs. Fonduri Deschise de Investiții (OPCVM)",
    sourceUrl: "https://asfromania.ro/ro/a/2052/educatie-financiara",
    section: "Instrumente financiare pentru populație",
    year: 2025,
  },
  {
    id: "etf-bet",
    keywords: ["etf", "eft", "bet", "bvb", "bursa", "actiuni", "acțiuni", "indice", "patria", "tradeville"],
    content:
      "Un ETF (Exchange Traded Fund) pe indicele BET, precum ETF BET Patria-Tradeville, urmărește automat cele mai importante 20 de companii listate la Bursa de Valori București (Banca Transilvania, OMV Petrom, Hidroelectrica, Romgaz etc.). Dividendele sunt reinvestite, iar istoric indicele BET-TR a depășit rata inflației din România pe orizonturi de peste 10 ani.",
    sourceTitle: "BVB — Indicele BET & ETF-uri listate",
    sourceUrl: "https://www.bvb.ro/FinancialInstruments/Indices/IndicesProfiles",
    section: "ETF BET / BET-TR",
    year: 2025,
  },
  {
    id: "pilonul-3",
    keywords: ["pilonul 3", "pilon 3", "pensie facultativa", "pensie facultativă", "deductibil", "400 euro", "asf"],
    content:
      "Pilonul III reprezintă pensia privată facultativă, supravegheată de ASF (Autoritatea de Supraveghere Financiară). Contribuțiile sunt deductibile fiscal în limita a 400 EUR/an pentru angajat (și încă 400 EUR/an prin angajator), iar banii sunt investiți preponderent în titluri de stat românești și acțiuni listate.",
    sourceTitle: "ASF — Ghidul Pensiilor Private (Pilonul III)",
    sourceUrl: "https://asfromania.ro/ro/a/2054/pensii-private",
    section: "Legea nr. 204/2006 privind pensiile facultative",
    year: 2025,
  },
  {
    id: "pilonul-2",
    keywords: ["pilonul 2", "pilon 2", "obligatorie", "contributie", "4.75", "cnpp"],
    content:
      "Pilonul II este pensia privată obligatorie, unde 4,75% din venitul brut lunar este virat automat într-un fond administrat privat și supravegheat de ASF, separat de bugetul de stat (Pilonul I).",
    sourceTitle: "ASF — Statistici Pilonul II",
    sourceUrl: "https://asfromania.ro/ro/a/2054/pensii-private",
    section: "Legea nr. 411/2004",
    year: 2025,
  },
  {
    id: "titluri-stat",
    keywords: ["titluri de stat", "fidelis", "tezaur", "obligatiuni", "obligațiuni", "risc scazut", "risc scăzut", "neimpozabil"],
    content:
      "Titlurile de stat Fidelis și Tezaur sunt emise de Ministerul Finanțelor din România. Veniturile din dobânzi și câștigurile de capital sunt 100% neimpozabile conform Codului Fiscal (Art. 93), oferind cel mai scăzut nivel de risc din piața locală.",
    sourceTitle: "Ministerul Finanțelor — Titluri de Stat Fidelis & Tezaur",
    sourceUrl: "https://mfinante.gov.ro/web/trezor/titluri-de-stat",
    section: "Codul Fiscal Art. 93",
    year: 2025,
  },
  {
    id: "market-drop",
    keywords: ["scade", "piata", "piața", "criza", "criză", "pierd", "risc", "volatilitate", "inflatie", "inflație"],
    content:
      "Când piața scade pe termen scurt, investițiile lunare automate (Dollar-Cost Averaging prin round-up) cumpără mai multe unități de fond la un preț mai mic. În plus, portofoliul este diversificat între Titluri de Stat (dobândă fixă garantată de stat), Pilonul III și ETF BET. Afișăm mereu 3 scenarii (pesimist +1,5% real, bază +4,5% real, optimist +7,5% real peste inflația BNR de 3,5%).",
    sourceTitle: "BNR & ASF — Raport Stabilitate Financiară și Randamente Reale",
    sourceUrl: "https://www.bnr.ro/Publicatii-periodice-204.aspx",
    section: "Scenarii de randament real și inflație",
    year: 2025,
  },
  {
    id: "state-pension-gap",
    keywords: ["zile de libertate", "cifra", "calcul", "formula", "pensie de stat", "decalaj", "65 ani"],
    content:
      "În România, pensia de stat (Pilonul I) acoperă în medie ~48% din ultimul salariu net (date CNPP / OECD), în timp ce un trai confortabil la pensie necesită ~65% din venitul activ. Diferența de 17% reprezintă decalajul zilnic pe care îl acoperă Zilele de Libertate din economiile și investițiile tale private.",
    sourceTitle: "CNPP & INS — Indicatori demografici și rata de înlocuire a pensiei",
    sourceUrl: "https://www.cnpp.ro/indicatori-statistici-pilon-i",
    section: "Legea nr. 360/2023 privind sistemul public de pensii",
    year: 2025,
  },
];
