// Generates local placeholder covers for demo vehicles (is_demo=true).
// Honest placeholders on brand surfaces — no fake photos, no remote URLs.
// Run: node scripts/generate-demo-images.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "demo");
mkdirSync(outDir, { recursive: true });

const vehicles = [
  { slug: "volkswagen-golf-1-5-tsi-life-2021", make: "Volkswagen", model: "Golf", version: "1.5 TSI Life", year: 2021 },
  { slug: "audi-a3-sportback-30-tdi-s-tronic-2022", make: "Audi", model: "A3 Sportback", version: "30 TDI S tronic", year: 2022 },
  { slug: "toyota-yaris-1-5-hybrid-trend-2023", make: "Toyota", model: "Yaris", version: "1.5 Hybrid Trend", year: 2023 },
  { slug: "jeep-renegade-1-0-t3-limited-2020", make: "Jeep", model: "Renegade", version: "1.0 T3 Limited", year: 2020 },
  { slug: "fiat-500x-1-3-multijet-cross-2019", make: "Fiat", model: "500X", version: "1.3 MultiJet Cross", year: 2019 },
  { slug: "renault-clio-tce-90-gpl-zen-2021", make: "Renault", model: "Clio", version: "TCe 90 GPL Zen", year: 2021 },
];

const W = 1600;
const H = 1000;

function svgCover({ make, model, version, year }) {
  return `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="18%" cy="0%" r="120%">
      <stop offset="0%" stop-color="#1d1a17"/>
      <stop offset="45%" stop-color="#121110"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <line x1="96" y1="${H - 232}" x2="256" y2="${H - 232}" stroke="#f97316" stroke-width="6"/>
  <text x="96" y="200" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="600" letter-spacing="14" fill="#b8b8b8">${make.toUpperCase()}</text>
  <text x="96" y="${H - 320}" font-family="Arial, Helvetica, sans-serif" font-size="150" font-weight="700" letter-spacing="-3" fill="#f7f7f5">${model}</text>
  <text x="96" y="${H - 150}" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="400" fill="#b8b8b8">${version} · ${year}</text>
  <text x="${W - 96}" y="${H - 88}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="600" letter-spacing="6" fill="#5a5a57">FOTO IN ARRIVO · DEMO</text>
</svg>`;
}

for (const v of vehicles) {
  const file = join(outDir, `${v.slug}.webp`);
  await sharp(Buffer.from(svgCover(v))).webp({ quality: 82 }).toFile(file);
  console.log("generated", file);
}
