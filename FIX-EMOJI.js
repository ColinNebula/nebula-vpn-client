#!/usr/bin/env node
/**
 * FIX-EMOJI.js - Replace emojis with text alternatives for Electron
 * 
 * Usage:
 *   node FIX-EMOJI.js          # Fix emojis
 *   node FIX-EMOJI.js --restore # Restore originals
 */

const fs = require('fs');
const path = require('path');

const RESTORE = process.argv.includes('--restore');

// Emoji to text replacements
const replacements = [
  { emoji: '✓', text: '[OK]' },
  { emoji: '✗', text: '[X]' },
  { emoji: '✕', text: 'X' },
  { emoji: '⚠', text: '[!]' },
  { emoji: 'ℹ', text: '[i]' },
  { emoji: '⚙️', text: '[Settings]' },
  { emoji: '⚙', text: '[Settings]' },
  { emoji: '🔗', text: '[Link]' },
  { emoji: '🧅', text: '[Onion]' },
  { emoji: '🔄', text: '[Rotate]' },
  { emoji: '⚡', text: '[Fast]' },
  { emoji: '🔒', text: '[Lock]' },
  { emoji: '🌫️', text: '[Cloud]' },
  { emoji: '🌫', text: '[Cloud]' },
  { emoji: '🌐', text: '[Globe]' },
  { emoji: '🎬', text: '[Play]' },
  { emoji: '🎮', text: '[Game]' },
  { emoji: '⚖️', text: '[Balance]' },
  { emoji: '⚖', text: '[Balance]' },
  { emoji: '🛡️', text: '[Shield]' },
  { emoji: '🛡', text: '[Shield]' },
  { emoji: '🔐', text: '[Secure]' },
  { emoji: '🌍', text: '[World]' },
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
];

// Files to process
const filesToFix = [
  'src/components/DonateModal/index.js',
  'src/components/MultiHop/index.js',
  'src/components/AdminPanel/index.js',
  'src/index.js',
  'src/App.js',
];

console.log('\n================================================================');
console.log('  ' + (RESTORE ? 'RESTORING ORIGINAL FILES' : 'FIXING EMOJI RENDERING'));
console.log('================================================================\n');

if (RESTORE) {
  let restored = 0;
  filesToFix.forEach(file => {
    const backupFile = file + '.emoji-backup';
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, file);
      fs.unlinkSync(backupFile);
      console.log('Restored:', file);
      restored++;
    }
  });
  
  if (restored === 0) {
    console.log('No backup files found. Nothing to restore.');
  } else {
    console.log('\nRestore complete! Rebuild to see emojis again.');
  }
  process.exit(0);
}

// Fix emojis
let filesFixed = 0;

filesToFix.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log('Skipping', file, '(not found)');
    return;
  }
  
  // Backup original
  const backupFile = file + '.emoji-backup';
  if (!fs.existsSync(backupFile)) {
    fs.copyFileSync(file, backupFile);
    console.log('Backed up:', file);
  }
  
  // Read content
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  // Replace each emoji
  replacements.forEach(({ emoji, text }) => {
    const regex = new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, text);
  });
  
  // Only write if changed
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    filesFixed++;
    console.log('Fixed:', file);
  } else {
    console.log('No emojis found in:', file);
  }
});

console.log('\n================================================================');
console.log('  EMOJI FIX COMPLETE');
console.log('================================================================\n');

console.log('Files processed:', filesFixed);
console.log('');
console.log('Next steps:');
console.log('  1. Rebuild the app: npm run electron:prepare');
console.log('  2. Run Electron: npm run electron');
console.log('');
console.log('To restore emojis:');
console.log('  node FIX-EMOJI.js --restore');
console.log('');
