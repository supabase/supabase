export const REGIONS = ["ams", "fra", "gru", "hkg", "iad", "syd"] as const;

export const VERCEL_EDGE_REGIONS = [
  "hnd1",
  "sin1",
  "cpt1",
  "fra1",
  "hkg1",
  "syd1",
  "gru1",
  "dub1",
  "sfo1",
  "cdg1",
  "icn1",
  "kix1",
  "iad1",
  "arn1",
  "bom1",
  "lhr1",
  "cle1",
] as const;

export const regions: Record<string, { label: string; flag: string }> = {
  // REGIONS
  ams: { label: "Amsterdam", flag: "🇳🇱" },
  fra: { label: "Frankfurt", flag: "🇩🇪" },
  gru: { label: "Sao Paulo", flag: "🇧🇷" },
  hkg: { label: "Hong Kong", flag: "🇭🇰" },
  iad: { label: "Washington D.C.", flag: "🇺🇸" },
  syd: { label: "Sydney", flag: "🇦🇺" },
  // VERCEL EDGE REGIONS
  hnd1: { label: "Tokyo", flag: "🇯🇵" },
  sin1: { label: "Singapore", flag: "🇸🇬" },
  cpt1: { label: "Cape Town", flag: "🇿🇦" },
  fra1: { label: "Paris", flag: "🇫🇷" },
  hkg1: { label: "Hong Kong", flag: "🇭🇰" },
  syd1: { label: "Sydney", flag: "🇦🇺" },
  gru1: { label: "Sao Paulo", flag: "🇧🇷" },
  dub1: { label: "Dublin", flag: "🇮🇪" },
  sfo1: { label: "San Francisco", flag: "🇺🇸" },
  cdg1: { label: "Paris", flag: "🇫🇷" },
  icn1: { label: "Seoul", flag: "🇰🇷" },
  kix1: { label: "Osaka", flag: "🇯🇵" },
  iad1: { label: "Washington D.C.", flag: "🇺🇸" },
  arn1: { label: "Stockholm", flag: "🇸🇪" },
  bom1: { label: "Mumbai", flag: "🇮🇳" },
  lhr1: { label: "London", flag: "🇬🇧" },
  cle1: { label: "Cleveland", flag: "🇺🇸" },
};
