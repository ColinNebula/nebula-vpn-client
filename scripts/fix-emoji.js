#!/usr/bin/env node
/**
 * fix-emoji.js — Repair mojibake (corrupted Unicode/emoji) in source files.
 *
 * Root cause: UTF-8 files read/written as CP1252 causes multi-byte UTF-8
 * sequences to be stored as their individual Latin/CP1252 character representations.
 *
 * Fix strategy: detect runs of CP1252-range characters, map each char back to
 * its CP1252 byte value, then re-decode those bytes as UTF-8.
 *
 * Usage:
 *   node scripts/fix-emoji.js            # fix files in-place
 *   node scripts/fix-emoji.js --dry-run  # report without writing
 *   node scripts/fix-emoji.js --file src/App.js  # fix a single file
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const DRY_RUN   = process.argv.includes('--dry-run');
const FILE_ARG  = (() => {
  const idx = process.argv.indexOf('--file');
  return idx !== -1 ? process.argv[idx + 1] : null;
})();
const ROOT = path.resolve(__dirname, '..');

// ── CP1252 mapping ────────────────────────────────────────────────────────────
// Bytes 0x80–0x9F in CP1252 map to specific Unicode codepoints (not Latin-1).
// All other bytes are identity (byte value == Unicode codepoint).
const CP1252_EXTRAS = {
  0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160,
  0x8B: 0x2039, 0x8C: 0x0152, 0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153,
  0x9E: 0x017E, 0x9F: 0x0178,
};

// Build reverse map: Unicode codepoint → CP1252 byte value
const CP1252_REVERSE = new Map();
for (let b = 0; b < 256; b++) {
  if (b >= 0x80 && b <= 0x9F) {
    const cp = CP1252_EXTRAS[b];
    if (cp !== undefined) CP1252_REVERSE.set(cp, b);
    // Undefined positions (0x81, 0x8D, 0x8F, 0x90, 0x9D): byte == codepoint
  } else {
    CP1252_REVERSE.set(b, b); // ASCII and Latin-1 supplement: byte == codepoint
  }
}

// Set of codepoints that CP1252 maps to above U+017E (not covered by range check)
const CP1252_HIGH_SET = new Set(
  Object.values(CP1252_EXTRAS).filter(cp => cp > 0x017E)
);

/**
 * Returns true if this codepoint could be a raw byte masquerading as a char
 * (i.e. is in the CP1252 representable range).
 */
function isMojibakeChar(cp) {
  if (cp >= 0x0080 && cp <= 0x017E) return true;  // Latin-1 / CP1252 low range
  return CP1252_HIGH_SET.has(cp);                   // CP1252 high specials (€, —, etc.)
}

/**
 * Convert a suspected mojibake string to a Buffer using CP1252 byte values.
 * Returns null if any character cannot be mapped to a CP1252 byte.
 */
function cp1252ToBytes(str) {
  const bytes = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp <= 0x007F) {
      bytes.push(cp);
    } else if (cp >= 0x0080 && cp <= 0x009F) {
      // C1 control chars: byte == codepoint (undefined CP1252 positions pass through)
      bytes.push(cp);
    } else if (cp <= 0x00FF) {
      bytes.push(cp); // Latin-1 supplement: byte == codepoint
    } else if (CP1252_REVERSE.has(cp)) {
      bytes.push(CP1252_REVERSE.get(cp));
    } else {
      return null; // Codepoint can't be a CP1252 byte → not mojibake
    }
  }
  return Buffer.from(bytes);
}

/**
 * Try to decode a suspected mojibake segment back to its intended Unicode string.
 * Returns the corrected string, or null if the segment is not fixable mojibake.
 */
function tryFix(segment) {
  const buf = cp1252ToBytes(segment);
  if (!buf) return null;
  try {
    const decoded = buf.toString('utf8');
    if (decoded.includes('\uFFFD')) return null; // Invalid UTF-8 — not mojibake
    if (decoded === segment)         return null; // No change needed
    if (decoded.length >= segment.length) return null; // Should compress, not expand
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Walk the content string, collecting and fixing runs of CP1252-range chars.
 * Returns { result, fixes } where fixes is an array of { line, original, fixed }.
 */
function fixContent(content) {
  let result = '';
  let i      = 0;
  const fixes = [];

  // Track line number for reporting
  let line = 1;

  while (i < content.length) {
    const cp      = content.codePointAt(i);
    const charLen = cp > 0xFFFF ? 2 : 1; // surrogate pairs span 2 JS chars

    if (cp === 0x0A) line++; // newline

    if (!isMojibakeChar(cp)) {
      result += content.slice(i, i + charLen);
      i += charLen;
      continue;
    }

    // Collect a consecutive run of mojibake-range chars
    let j = i;
    while (j < content.length) {
      const c = content.codePointAt(j);
      if (!isMojibakeChar(c)) break;
      j += c > 0xFFFF ? 2 : 1;
    }

    const segment = content.slice(i, j);
    const fixed   = tryFix(segment);

    if (fixed !== null) {
      fixes.push({ line, original: segment, fixed });
      result += fixed;
    } else {
      result += segment;
    }

    i = j;
  }

  return { result, fixes };
}

// ── File discovery ────────────────────────────────────────────────────────────
function getSourceFiles() {
  // Quick check: does the string contain any high-byte chars?
  const FAST_CHECK = /[\x80-\xFF\u0100-\u017E\u017F-\u024F\u2013\u2014\u2018-\u201E\u2020-\u2022\u2026\u2039\u203A\u20AC\u2122]/;

  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'build', '.git', 'dist'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        files.push(full);
      }
    }
  }

  if (FILE_ARG) {
    const abs = path.isAbsolute(FILE_ARG) ? FILE_ARG : path.join(ROOT, FILE_ARG);
    files.push(abs);
  } else {
    walk(path.join(ROOT, 'src'));
    // Also check server
    if (fs.existsSync(path.join(ROOT, 'server', 'src'))) {
      walk(path.join(ROOT, 'server', 'src'));
    }
  }

  return files;
}

// ── Reporting helpers ─────────────────────────────────────────────────────────
function safeDisplay(str) {
  // Show a human-readable version — replace control chars with their U+XXXX form
  return [...str].map(ch => {
    const cp = ch.codePointAt(0);
    if (cp < 0x20 || (cp >= 0x7F && cp < 0xA0)) {
      return `<U+${cp.toString(16).toUpperCase().padStart(4, '0')}>`;
    }
    return ch;
  }).join('');
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  const mode = DRY_RUN ? ' [DRY RUN]' : '';
  console.log(`\n🔍 Scanning for mojibake/corrupted emoji${mode}...\n`);

  const files      = getSourceFiles();
  let   totalFiles = 0;
  let   totalFixes = 0;
  const errors     = [];

  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch (e) {
      errors.push(`${file}: ${e.message}`);
      continue;
    }

    const { result, fixes } = fixContent(content);
    if (fixes.length === 0) continue;

    totalFiles++;
    totalFixes += fixes.length;

    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    console.log(`📄 ${rel}  (${fixes.length} fix${fixes.length > 1 ? 'es' : ''})`);

    for (const { line, original, fixed } of fixes) {
      const orig  = safeDisplay(original);
      const after = safeDisplay(fixed);
      console.log(`   L${line}  "${orig}"  →  "${after}"`);
    }
    console.log('');

    if (!DRY_RUN) {
      try {
        fs.writeFileSync(file, result, 'utf8');
      } catch (e) {
        errors.push(`${file}: write failed — ${e.message}`);
      }
    }
  }

  if (errors.length) {
    console.error('\n⛔ Errors:');
    errors.forEach(e => console.error('  ', e));
  }

  if (totalFiles === 0) {
    console.log('✅ No mojibake found — all files look clean.\n');
  } else {
    const action = DRY_RUN ? '⚠️  Dry run — no files written.' : `✅ Fixed`;
    console.log(`${action} ${totalFiles} file(s), ${totalFixes} corruption(s) repaired.\n`);
  }
}

main();
