#!/usr/bin/env node
/**
 * FIX-EMOJI.js - Fix corrupted emojis and replace with text alternatives or restore originals
 * 
 * This script handles:
 * 1. Corrupted emojis showing as ?? or question marks
 * 2. Replacing emojis with text for Electron compatibility
 * 3. Restoring original emojis from backups
 * 
 * Usage:
 *   node FIX-EMOJI.js                    # Fix all corrupted emojis and convert to text
 *   node FIX-EMOJI.js --restore          # Restore original emojis from backups
 *   node FIX-EMOJI.js --fix-corruption   # Only fix corruption, keep working emojis
 */

const fs = require('fs');
const path = require('path');

const RESTORE = process.argv.includes('--restore');
const FIX_CORRUPTION_ONLY = process.argv.includes('--fix-corruption');
const CONVERT_BRACKETS = !RESTORE && !FIX_CORRUPTION_ONLY; // By default, convert bracket placeholders to emojis

// Text placeholder to emoji mappings (for converting [Shield] -> 🛡️ etc.)
const textToEmoji = [
  { text: /\[Shield\]/g, emoji: '🛡️' },
  { text: /\[Lock\]/g, emoji: '🔒' },
  { text: /\[Secure\]/g, emoji: '🔐' },
  { text: /\[Eye\]/g, emoji: '👁️' },
  { text: /\[Eyes\]/g, emoji: '👀' },
  { text: /\[Time\]/g, emoji: '⏱️' },
  { text: /\[Alarm\]/g, emoji: '⏰' },
  { text: /\[Timer\]/g, emoji: '⏱️' },
  { text: /\[Clock\]/g, emoji: '🕐' },
  { text: /\[Fast\]/g, emoji: '⚡' },
  { text: /\[Globe\]/g, emoji: '🌐' },
  { text: /\[World\]/g, emoji: '🌍' },
  { text: /\[Location\]/g, emoji: '📍' },
  { text: /\[Rotate\]/g, emoji: '🔄' },
  { text: /\[Blocked\]/g, emoji: '🚫' },
  { text: /\[Alert\]/g, emoji: '🚨' },
  { text: /\[Yellow\]/g, emoji: '⚠️' },
  { text: /\[Green\]/g, emoji: '✅' },
  { text: /\[Red\]/g, emoji: '🔴' },
  { text: /\[Blue\]/g, emoji: '🔵' },
  { text: /\[OK\]/g, emoji: '✅' },
  { text: /\[Signal\]/g, emoji: '📶' },
  { text: /\[Work\]/g, emoji: '💼' },
  { text: /\[Play\]/g, emoji: '▶️' },
  { text: /\[Game\]/g, emoji: '🎮' },
  { text: /\[Folder\]/g, emoji: '📁' },
  { text: /\[Launch\]/g, emoji: '🚀' },
  { text: /\[Onion\]/g, emoji: '🧅' },
  { text: /\[Ninja\]/g, emoji: '🥷' },
  { text: /\[Plugin\]/g, emoji: '🔌' },
  { text: /\[Stats\]/g, emoji: '📊' },
  { text: /\[Settings\]/g, emoji: '⚙️' },
  { text: /\[Mobile\]/g, emoji: '📱' },
  { text: /\[Battery\]/g, emoji: '🔋' },
  { text: /\[Repeat\]/g, emoji: '🔁' },
  { text: /\[Idea\]/g, emoji: '💡' },
  { text: /\[Robot\]/g, emoji: '🤖' },
  { text: /\[Star\]/g, emoji: '⭐' },
  { text: /\[Book\]/g, emoji: '📖' },
  { text: /\[!\]/g, emoji: '⚠️' },
  { text: /\[Chain\]/g, emoji: '⛓️' },
  { text: /\[Speech\]/g, emoji: '💬' },
  { text: /\[Heart\]/g, emoji: '❤️' },
  { text: /\[Balance\]/g, emoji: '⚖️' },
  { text: /\[Link\]/g, emoji: '🔗' },
  { text: /\[Auto\]/g, emoji: '🤖' },
  { text: /\[Map\]/g, emoji: '🗺️' },
  { text: /\[Computer\]/g, emoji: '💻' },
  { text: /\[Door\]/g, emoji: '🚪' },
  { text: /\[Flag\]/g, emoji: '🏁' },
  { text: /\[DEBUG\]/g, emoji: '🔍' },
  { text: /\[Edit\]/g, emoji: '✏️' },
  { text: /\[Delete\]/g, emoji: '🗑️' },
  { text: /\[Save\]/g, emoji: '💾' },
  { text: /\[Admin\]/g, emoji: '👑' },
  { text: /\[Users\]/g, emoji: '👥' },
  { text: /\[AI\]/g, emoji: '🤖' },
  { text: /\[Target\]/g, emoji: '🎯' },
  { text: /\[Theme\]/g, emoji: '🎨' },
  { text: /\[Tool\]/g, emoji: '🔧' },
  { text: /\[Chat\]/g, emoji: '💬' },
  { text: /\[Ticket\]/g, emoji: '🎫' },
  { text: /\[Email\]/g, emoji: '📧' },
  { text: /\[Coffee\]/g, emoji: '☕' },
];

// Corrupted emoji patterns (showing as question marks)
// NOTE: Be careful to only match emoji corruption in strings, not JS operators like ??
const corruptionFixes = [
  // Debug console.log markers that got corrupted - only in strings
  { pattern: /console\.log\(['"](\?\?|\?{2,}|\uFFFD{1,2})\s/g, replacement: "console.log('🔍 " },
  { pattern: /console\.warn\(['"](\?\?|\?{2,}|\uFFFD{1,2})\s/g, replacement: "console.warn('⚠️ " },
  { pattern: /console\.error\(['"](\?\?|\?{2,}|\uFFFD{1,2})\s/g, replacement: "console.error('❌ " },
  { pattern: /console\.info\(['"](\?\?|\?{2,}|\uFFFD{1,2})\s/g, replacement: "console.info('ℹ️ " },
  // Corrupted emojis in JSX/button text (careful to avoid ?? operator)
  // Pattern: ?? followed by space and word (not = or ; or ))
  { pattern: />\s*\?\?\s+(\w)/g, replacement: '>• $1' },  // >?? Word -> >• Word
  { pattern: />\s*\?\?\?\s+(\w)/g, replacement: '>• $1' },  // >??? Word -> >• Word  
  { pattern: />\s*\?\s+(\w)/g, replacement: '>• $1' },  // >? Word -> >• Word (single corrupted emoji)
  { pattern: /"\?\?\s+(\w)/g, replacement: '"• $1' },  // "?? Word -> "• Word
  { pattern: /'\?\?\s+(\w)/g, replacement: "'• $1" },  // '?? Word -> '• Word
  { pattern: /\?\s+Upgrade/g, replacement: '★ Upgrade' },
  { pattern: /\{\?\?\}/g, replacement: '{•}' },  // {??} in JSX
  { pattern: /isDarkMode \? '\?\?' : '\?\?'/g, replacement: "isDarkMode ? '☾' : '☼'" },
  // Replacement character (U+FFFD) - the actual rendered replacement character
  { pattern: /\uFFFD{2}/g, replacement: '🔸' },
  { pattern: /\uFFFD/g, replacement: '🔸' },
];

// Emoji to text replacements (for full conversion mode)
const emojiToText = [
  { emoji: '🔍', text: '[DEBUG]' },
  { emoji: '🐛', text: '[DEBUG]' },
  { emoji: '✓', text: '[OK]' },
  { emoji: '✅', text: '[OK]' },
  { emoji: '✗', text: '[X]' },
  { emoji: '✕', text: 'X' },
  { emoji: '❌', text: '[X]' },
  { emoji: '⚠️', text: '[!]' },
  { emoji: '⚠', text: '[!]' },
  { emoji: 'ℹ️', text: '[i]' },
  { emoji: 'ℹ', text: '[i]' },
  { emoji: '⚙️', text: '[Settings]' },
  { emoji: '⚙', text: '[Settings]' },
  { emoji: '🔗', text: '[Link]' },
  { emoji: '🧅', text: '[Onion]' },
  { emoji: '🔄', text: '[Rotate]' },
  { emoji: '⚡', text: '[Fast]' },
  { emoji: '🔒', text: '[Lock]' },
  { emoji: '🔐', text: '[Secure]' },
  { emoji: '🛡️', text: '[Shield]' },
  { emoji: '🛡', text: '[Shield]' },
  { emoji: '🌫️', text: '[Cloud]' },
  { emoji: '🌫', text: '[Cloud]' },
  { emoji: '🌐', text: '[Globe]' },
  { emoji: '🌍', text: '[World]' },
  { emoji: '🎬', text: '[Play]' },
  { emoji: '🎮', text: '[Game]' },
  { emoji: '⚖️', text: '[Balance]' },
  { emoji: '⚖', text: '[Balance]' },
  { emoji: '📶', text: '[Signal]' },
  { emoji: '🗺️', text: '[Map]' },
  { emoji: '🗺', text: '[Map]' },
  { emoji: '✨', text: '[Auto]' },
  { emoji: '🚀', text: '[Launch]' },
  { emoji: '💾', text: '[Save]' },
  { emoji: '☕', text: '[Coffee]' },
  { emoji: '❤️', text: '[Heart]' },
  { emoji: '❤', text: '[Heart]' },
  { emoji: '💜', text: '[Heart]' },
  { emoji: '👤', text: '[User]' },
  { emoji: '🎨', text: '[Theme]' },
  { emoji: '👁️', text: '[Eye]' },
  { emoji: '👁', text: '[Eye]' },
  { emoji: '⏳', text: '[Wait]' },
  { emoji: '⏱️', text: '[Time]' },
  { emoji: '🔸', text: '[*]' },
  { emoji: '🔧', text: '[Tool]' },
  { emoji: '🚨', text: '[Alert]' },
  { emoji: '🟡', text: '[Yellow]' },
  { emoji: '🟢', text: '[Green]' },
  { emoji: '🟣', text: '[Purple]' },
  { emoji: '🔴', text: '[Red]' },
  { emoji: '🆔', text: '[ID]' },
  { emoji: '📡', text: '[Signal]' },
  { emoji: '📊', text: '[Stats]' },
  { emoji: '📝', text: '[Note]' },
  { emoji: '🔑', text: '[Key]' },
  { emoji: '🎯', text: '[Target]' },
  { emoji: '👑', text: '[Admin]' },
  { emoji: '👥', text: '[Users]' },
  { emoji: '🗑️', text: '[Delete]' },
  { emoji: '🗑', text: '[Delete]' },
  { emoji: '🧠', text: '[AI]' },
  { emoji: '⏱', text: '[Timer]' },
  { emoji: '💻', text: '[Computer]' },
  { emoji: '📈', text: '[Chart]' },
  { emoji: '📉', text: '[Decrease]' },
  { emoji: '🔔', text: '[Bell]' },
  { emoji: '🔕', text: '[Muted]' },
  { emoji: '🌙', text: '[Night]' },
  { emoji: '☀️', text: '[Day]' },
  { emoji: '☀', text: '[Day]' },
  { emoji: '🎭', text: '[Privacy]' },
  { emoji: '🔓', text: '[Unlocked]' },
  { emoji: '📱', text: '[Mobile]' },
  { emoji: '💰', text: '[Money]' },
  { emoji: '💳', text: '[Card]' },
  { emoji: '🎁', text: '[Gift]' },
  { emoji: '⭐', text: '[Star]' },
  { emoji: '🌟', text: '[Star]' },
  { emoji: '…', text: '...' },  // Unicode ellipsis
  { emoji: '🚪', text: '[Door]' },
  { emoji: '🏁', text: '[Flag]' },
  { emoji: '🕐', text: '[Clock]' },
  { emoji: '🔵', text: '[Blue]' },
  { emoji: '🚫', text: '[Blocked]' },
  { emoji: '🏠', text: '[Home]' },
  { emoji: '😴', text: '[Sleep]' },
  { emoji: '📋', text: '[Clipboard]' },
  { emoji: '💡', text: '[Idea]' },
  { emoji: '💬', text: '[Chat]' },
  { emoji: '🎫', text: '[Ticket]' },
  { emoji: '📧', text: '[Email]' },
  { emoji: '📟', text: '[Pager]' },
  { emoji: '🐕', text: '[Dog]' },
  { emoji: '🔌', text: '[Plugin]' },
  { emoji: '📤', text: '[Upload]' },
  { emoji: '📦', text: '[Box]' },
  { emoji: '🏥', text: '[Medical]' },
  { emoji: '📄', text: '[Doc]' },
  { emoji: '📜', text: '[Scroll]' },
  { emoji: '📺', text: '[TV]' },
  { emoji: '💼', text: '[Work]' },
  { emoji: '🔋', text: '[Battery]' },
  { emoji: '📞', text: '[Phone]' },
  { emoji: '🎵', text: '[Music]' },
  { emoji: '👩‍💼', text: '[Woman]' },
  { emoji: '👨‍💻', text: '[Man-Dev]' },
  { emoji: '👩‍🔬', text: '[Woman-Sci]' },
  { emoji: '👨‍💼', text: '[Man]' },
  { emoji: '📍', text: '[Location]' },
  { emoji: '🕒', text: '[Clock2]' },
  { emoji: '🛠️', text: '[Tools]' },
  { emoji: '🛠', text: '[Tools]' },
  { emoji: '🤖', text: '[Robot]' },
  { emoji: '💎', text: '[Gem]' },
  { emoji: '🗳️', text: '[Vote]' },
  { emoji: '🗳', text: '[Vote]' },
  { emoji: '👍', text: '[Yes]' },
  { emoji: '👎', text: '[No]' },
  { emoji: '🔮', text: '[Crystal]' },
  { emoji: '📹', text: '[Video]' },
  { emoji: '🎉', text: '[Party]' },
  { emoji: '💥', text: '[Boom]' },
  { emoji: '🔶', text: '[Orange-Diamond]' },
  { emoji: '🕵️', text: '[Detective]' },
  { emoji: '🕵', text: '[Detective]' },
  { emoji: '📭', text: '[Mailbox]' },
  { emoji: '📅', text: '[Calendar]' },
  { emoji: '🌌', text: '[Galaxy]' },
  { emoji: '🌊', text: '[Ocean]' },
  { emoji: '🌲', text: '[Tree]' },
  { emoji: '🌅', text: '[Sunset]' },
  { emoji: '📘', text: '[Book]' },
  { emoji: '🌈', text: '[Rainbow]' },
  { emoji: '🔤', text: '[ABC]' },
  { emoji: '📏', text: '[Ruler]' },
  { emoji: '👀', text: '[Eyes]' },
  { emoji: '⏰', text: '[Alarm]' },
  { emoji: '🔁', text: '[Repeat]' },
  { emoji: '🔐', text: '[Lock-Key]' },
  { emoji: '❓', text: '[?]' },
  { emoji: '➕', text: '[+]' },
  { emoji: '✏️', text: '[Edit]' },
  { emoji: '✏', text: '[Edit]' },
  { emoji: '✂️', text: '[Cut]' },
  { emoji: '✂', text: '[Cut]' },
  { emoji: '⚫', text: '[Black]' },
  { emoji: '⛓️', text: '[Chain]' },
  { emoji: '⛓', text: '[Chain]' },
  { emoji: '⛽', text: '[Gas]' },
  { emoji: '☰', text: '[Menu]' },
  { emoji: '📁', text: '[Folder]' },
  { emoji: '🥷', text: '[Ninja]' },
  { emoji: '🗨️', text: '[Speech]' },
  { emoji: '🗨', text: '[Speech]' },
  { emoji: '‍', text: '' },  // Zero-width joiner (used in compound emojis)
  { emoji: '👩', text: '[Woman]' },
  { emoji: '👨', text: '[Man]' },
  { emoji: '📖', text: '[Book]' },
  { emoji: '[Icon]', text: '[*]' },  // Generic icon placeholder
  { emoji: '[Moon]', text: '[Moon]' },  // Keep Moon as-is (already text)
  { emoji: '[Sun]', text: '[Sun]' },  // Keep Sun as-is (already text)
];

// Files to process
const filesToFix = [
  'src/components/DonateModal/index.js',
  'src/components/MultiHop/index.js',
  'src/components/AdminPanel/index.js',
  'src/components/AINetworkOptimizer/index.js',
  'src/components/AutoConnectWiFi/index.js',
  'src/components/AdvancedAnalytics/index.js',
  'src/components/AdaptiveLearning/index.js',
  'src/components/TransparencyReport/index.js',
  'src/index.js',
  'src/App.js',
];

// Helper function to recursively find all .js files in src/
function findAllJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        findAllJsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') && !file.endsWith('.emoji-backup')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

console.log('\n================================================================');
if (RESTORE) {
  console.log('  RESTORING ORIGINAL FILES FROM BACKUPS');
} else if (FIX_CORRUPTION_ONLY) {
  console.log('  FIXING CORRUPTED EMOJIS ONLY');
} else if (CONVERT_BRACKETS) {
  console.log('  CONVERTING TEXT PLACEHOLDERS TO EMOJIS');
} else {
  console.log('  FIXING EMOJIS - CONVERTING TO TEXT ALTERNATIVES');
}
console.log('================================================================\n');

if (RESTORE) {
  let restored = 0;
  const allJsFiles = [
    ...findAllJsFiles('src'),
    ...findAllJsFiles('electron'),
    ...findAllJsFiles('public'),
    ...findAllJsFiles('server'),
  ];
  
  allJsFiles.forEach(file => {
    const backupFile = file + '.emoji-backup';
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, file);
      fs.unlinkSync(backupFile);
      console.log('✓ Restored:', file);
      restored++;
    }
  });
  
  if (restored === 0) {
    console.log('No backup files found. Nothing to restore.');
  } else {
    console.log(`\n✓ Restored ${restored} file(s). Rebuild to see emojis again.`);
  }
  process.exit(0);
}

// Fix emojis
let filesFixed = 0;
let changesDetected = false;

// Get all JS files in src/, electron/, public/, and server/
const allJsFiles = [
  ...findAllJsFiles('src'),
  ...findAllJsFiles('electron'),
  ...findAllJsFiles('public'),
  ...findAllJsFiles('server'),
];

console.log(`Scanning ${allJsFiles.length} JavaScript files...\n`);

allJsFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log('⊘ Skipping', file, '(not found)');
    return;
  }
  
  // Read content
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  // Step 1: Fix corrupted emojis (question marks, replacement characters)
  corruptionFixes.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      changesDetected = true;
    }
    content = content.replace(pattern, replacement);
  });
  
  // Step 2: Convert text placeholders to emojis (like [Shield] -> 🛡️)
  if (CONVERT_BRACKETS) {
    textToEmoji.forEach(({ text, emoji }) => {
      if (text.test(content)) {
        changesDetected = true;
      }
      content = content.replace(text, emoji);
    });
  }
  
  // Step 3: If in FIX_CORRUPTION_ONLY mode, we're done. Otherwise also convert emojis to text (old behavior)
  if (!FIX_CORRUPTION_ONLY && !CONVERT_BRACKETS) {
    emojiToText.forEach(({ emoji, text }) => {
      const regex = new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.match(regex)) {
        changesDetected = true;
      }
      content = content.replace(regex, text);
    });
  }
  
  // Only write and backup if changed
  if (content !== originalContent) {
    // Backup original (only if backup doesn't exist)
    const backupFile = file + '.emoji-backup';
    if (!fs.existsSync(backupFile)) {
      fs.copyFileSync(file, backupFile);
      console.log('💾 Backed up:', file);
    }
    
    fs.writeFileSync(file, content, 'utf8');
    filesFixed++;
    console.log('✓ Fixed:', file);
  }
});

console.log('\n================================================================');
console.log('  EMOJI FIX COMPLETE');
console.log('================================================================\n');

if (filesFixed > 0) {
  console.log(`✓ Fixed ${filesFixed} file(s)`);
  console.log('');
  console.log('Changes made:');
  if (FIX_CORRUPTION_ONLY) {
    console.log('  • Replaced ?? and corrupted characters with appropriate emojis');
    console.log('  • Working emojis were preserved');
  } else {
    console.log('  • Fixed corrupted emoji characters');
    console.log('  • Converted emojis to text alternatives for Electron');
  }
  console.log('');
  console.log('Next steps:');
  console.log('  1. Review the changes in your source files');
  console.log('  2. Rebuild the app: npm run electron:prepare');
  console.log('  3. Run Electron: npm run electron');
  console.log('');
  console.log('To restore original emojis:');
  console.log('  node FIX-EMOJI.js --restore');
} else {
  console.log('✓ No emoji issues found in scanned files.');
  console.log('  All files are already clean!');
}
console.log('');
