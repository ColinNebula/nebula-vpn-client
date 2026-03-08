/**
 * generate-icons.js
 * Converts public/logo.svg into all icon formats needed by the app:
 *   public/logo192.png   – React PWA manifest + Electron tray
 *   public/logo512.png   – React PWA manifest + electron-builder win/mac/linux
 *   public/favicon.ico   – Electron window icon (multi-size: 16,32,48,256)
 *
 * Run:  node scripts/generate-icons.js
 */

'use strict';

const sharp   = require('sharp');
const pngToIco = require('png-to-ico');
// The package's default export accepts file paths and returns an ICO buffer.
const buildIco = pngToIco.default || pngToIco;
const fs      = require('fs');
const path    = require('path');

const SVG_SRC  = path.join(__dirname, '../public/logo.svg');
const OUT_DIR  = path.join(__dirname, '../public');

const SIZES = {
  'logo192.png': 192,
  'logo512.png': 512,
};

const ICO_SIZES = [16, 32, 48, 256];

async function main() {
  const svgBuffer = fs.readFileSync(SVG_SRC);

  // ── PNGs ────────────────────────────────────────────────────────────────
  for (const [filename, size] of Object.entries(SIZES)) {
    const outPath = path.join(OUT_DIR, filename);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`✅  ${filename} (${size}x${size})`);
  }

  // ── favicon.ico (multi-size) ─────────────────────────────────────────────
  // Write each size to a temp PNG, then pass the paths to the ICO builder.
  const os     = require('os');
  const tmpDir = os.tmpdir();

  const tempFiles = await Promise.all(
    ICO_SIZES.map(async size => {
      const tmpFile = path.join(tmpDir, `nebula-ico-${size}.png`);
      await sharp(svgBuffer).resize(size, size).png().toFile(tmpFile);
      return tmpFile;
    })
  );

  const icoBuffer = await buildIco(tempFiles);
  const icoPath   = path.join(OUT_DIR, 'favicon.ico');
  fs.writeFileSync(icoPath, icoBuffer);

  // Cleanup temp files
  tempFiles.forEach(f => { try { fs.unlinkSync(f); } catch {} });

  console.log(`✅  favicon.ico (${ICO_SIZES.join(', ')}px)`);
}

main().catch(err => {
  console.error('❌  Icon generation failed:', err.message);
  process.exit(1);
});
