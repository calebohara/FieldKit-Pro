import sharp from "sharp";
import { writeFileSync } from "fs";
import { resolve } from "path";

const PUBLIC = resolve(import.meta.dirname, "../public");

// ─── Lightning bolt icon SVG ───
// Bold, geometric lightning bolt on dark background with blue accent
function iconSvg(size, padding = 0) {
  const s = size;
  const p = padding;
  const inner = s - p * 2;
  const r = Math.round(s * 0.22); // corner radius

  // Scale the lightning bolt to fit within the inner area
  // The bolt path is designed for a 100x100 viewBox
  const scale = inner / 100;
  const ox = p; // offset x
  const oy = p; // offset y

  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <linearGradient id="bolt" x1="0" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="${Math.max(1, size * 0.02)}" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <rect width="${s}" height="${s}" rx="${r}" fill="url(#bg)"/>
  <!-- subtle ring -->
  <rect x="${Math.round(s*0.04)}" y="${Math.round(s*0.04)}" width="${Math.round(s*0.92)}" height="${Math.round(s*0.92)}" rx="${Math.round(r*0.82)}" fill="none" stroke="#3b82f6" stroke-opacity="0.15" stroke-width="${Math.max(1, Math.round(s*0.015))}"/>
  <!-- lightning bolt -->
  <g transform="translate(${ox},${oy}) scale(${scale})" filter="url(#glow)">
    <path d="M 56 8 L 22 52 L 44 52 L 38 92 L 78 44 L 54 44 Z" fill="url(#bolt)"/>
  </g>
</svg>`;
}

// ─── OG Image SVG (1200×630) ───
function ogSvg() {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="boltGrad" x1="0" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
    <filter id="ogGlow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="textShadow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>

  <!-- Grid pattern -->
  <g opacity="0.03">
    ${Array.from({length: 30}, (_, i) => `<line x1="${i*40}" y1="0" x2="${i*40}" y2="630" stroke="#3b82f6" stroke-width="1"/>`).join('\n    ')}
    ${Array.from({length: 16}, (_, i) => `<line x1="0" y1="${i*40}" x2="1200" y2="${i*40}" stroke="#3b82f6" stroke-width="1"/>`).join('\n    ')}
  </g>

  <!-- Blue glow orbs -->
  <circle cx="200" cy="315" r="300" fill="#3b82f6" opacity="0.03"/>
  <circle cx="1000" cy="315" r="250" fill="#3b82f6" opacity="0.02"/>

  <!-- Lightning bolt icon -->
  <g transform="translate(100, 180)" filter="url(#ogGlow)">
    <rect width="120" height="120" rx="26" fill="#0f172a" stroke="#3b82f6" stroke-opacity="0.3" stroke-width="2"/>
    <g transform="translate(10,10) scale(1)">
      <path d="M 56 8 L 22 52 L 44 52 L 38 92 L 78 44 L 54 44 Z" fill="url(#boltGrad)"/>
    </g>
  </g>

  <!-- Title -->
  <text x="260" y="240" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="800" fill="#f8fafc" filter="url(#textShadow)">
    <tspan fill="#3b82f6">FieldKit</tspan><tspan fill="#f8fafc"> Pro</tspan>
  </text>

  <!-- Tagline -->
  <text x="260" y="290" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="26" fill="#94a3b8" font-weight="400">
    Field Engineering Toolkit for Controls Engineers
  </text>

  <!-- Feature pills -->
  <g transform="translate(260, 330)">
    <rect x="0" y="0" width="170" height="40" rx="20" fill="#3b82f6" fill-opacity="0.12" stroke="#3b82f6" stroke-opacity="0.25" stroke-width="1"/>
    <text x="85" y="26" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" fill="#60a5fa" font-weight="600">135+ Fault Codes</text>

    <rect x="185" y="0" width="170" height="40" rx="20" fill="#3b82f6" fill-opacity="0.12" stroke="#3b82f6" stroke-opacity="0.25" stroke-width="1"/>
    <text x="270" y="26" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" fill="#60a5fa" font-weight="600">120+ Parameters</text>

    <rect x="370" y="0" width="160" height="40" rx="20" fill="#3b82f6" fill-opacity="0.12" stroke="#3b82f6" stroke-opacity="0.25" stroke-width="1"/>
    <text x="450" y="26" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" fill="#60a5fa" font-weight="600">Works Offline</text>

    <rect x="545" y="0" width="180" height="40" rx="20" fill="#3b82f6" fill-opacity="0.12" stroke="#3b82f6" stroke-opacity="0.25" stroke-width="1"/>
    <text x="635" y="26" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" fill="#60a5fa" font-weight="600">BACnet/IP Tools</text>
  </g>

  <!-- Tool icons row -->
  <g transform="translate(260, 400)" opacity="0.6">
    <text font-family="system-ui, sans-serif" font-size="14" fill="#64748b">
      <tspan>ABB Drives</tspan>
      <tspan dx="10" fill="#334155">|</tspan>
      <tspan dx="10">Yaskawa Drives</tspan>
      <tspan dx="10" fill="#334155">|</tspan>
      <tspan dx="10">PID Tuning</tspan>
      <tspan dx="10" fill="#334155">|</tspan>
      <tspan dx="10">PPCL Reference</tspan>
      <tspan dx="10" fill="#334155">|</tspan>
      <tspan dx="10">Psychrometrics</tspan>
      <tspan dx="10" fill="#334155">|</tspan>
      <tspan dx="10">Unit Conversions</tspan>
    </text>
  </g>

  <!-- Bottom border accent -->
  <rect x="0" y="620" width="1200" height="10" fill="#3b82f6" opacity="0.8"/>

  <!-- URL -->
  <text x="600" y="590" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#475569" font-weight="500">fieldkitpro.com</text>
</svg>`;
}

// ─── Generate all icons ───
async function main() {
  console.log("Generating FieldKit Pro icons...");

  // Favicon SVG (for modern browsers)
  const faviconSvg = iconSvg(32);
  writeFileSync(resolve(PUBLIC, "favicon.svg"), faviconSvg);
  console.log("  ✓ favicon.svg");

  // favicon.ico (32×32 PNG in .ico — modern browsers accept this)
  await sharp(Buffer.from(iconSvg(32)))
    .png()
    .toFile(resolve(PUBLIC, "favicon.ico"));
  console.log("  ✓ favicon.ico (32×32)");

  // Apple touch icon (180×180)
  await sharp(Buffer.from(iconSvg(180)))
    .png()
    .toFile(resolve(PUBLIC, "apple-touch-icon.png"));
  console.log("  ✓ apple-touch-icon.png (180×180)");

  // PWA icon 192×192
  await sharp(Buffer.from(iconSvg(192)))
    .png()
    .toFile(resolve(PUBLIC, "icon-192.png"));
  console.log("  ✓ icon-192.png (192×192)");

  // PWA icon 512×512
  await sharp(Buffer.from(iconSvg(512)))
    .png()
    .toFile(resolve(PUBLIC, "icon-512.png"));
  console.log("  ✓ icon-512.png (512×512)");

  // PWA maskable icon 512×512 (extra padding for safe zone — 20% each side)
  await sharp(Buffer.from(iconSvg(512, 80)))
    .png()
    .toFile(resolve(PUBLIC, "icon-512-maskable.png"));
  console.log("  ✓ icon-512-maskable.png (512×512 maskable)");

  // OG Image 1200×630
  await sharp(Buffer.from(ogSvg()))
    .png({ quality: 90 })
    .toFile(resolve(PUBLIC, "og-image.png"));
  console.log("  ✓ og-image.png (1200×630)");

  console.log("\nAll icons generated!");
}

main().catch(console.error);
