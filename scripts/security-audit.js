#!/usr/bin/env node

/**
 * Nebula VPN - Security Audit Script
 * ===================================
 * Comprehensive security audit for the application
 * Run this regularly to ensure security posture
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const ROOT_DIR = path.resolve(__dirname, '..');

// Console colors
const c = {
  r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', b: '\x1b[34m',
  m: '\x1b[35m', c: '\x1b[36m', w: '\x1b[37m', x: '\x1b[0m', B: '\x1b[1m'
};

const results = {
  passed: [],
  warnings: [],
  failed: [],
  info: []
};

function log(type, msg) {
  const icons = { pass: `${c.g}✓${c.x}`, warn: `${c.y}⚠${c.x}`, fail: `${c.r}✗${c.x}`, info: `${c.b}ℹ${c.x}` };
  console.log(`${icons[type]} ${msg}`);
}

function section(title) {
  console.log(`\n${c.B}${c.c}━━━ ${title} ━━━${c.x}\n`);
}

/**
 * Check 1: Electron Security
 */
function checkElectronSecurity() {
  section('Electron Security');
  
  const mainJs = path.join(ROOT_DIR, 'electron', 'main.js');
  if (fs.existsSync(mainJs)) {
    const content = fs.readFileSync(mainJs, 'utf8');
    
    // Check nodeIntegration
    if (content.includes('nodeIntegration: false')) {
      log('pass', 'nodeIntegration is disabled');
      results.passed.push('Electron: nodeIntegration disabled');
    } else if (content.includes('nodeIntegration: true')) {
      log('fail', 'nodeIntegration is enabled - security risk!');
      results.failed.push('Electron: nodeIntegration should be false');
    }
    
    // Check contextIsolation
    if (content.includes('contextIsolation: true')) {
      log('pass', 'contextIsolation is enabled');
      results.passed.push('Electron: contextIsolation enabled');
    } else {
      log('fail', 'contextIsolation should be enabled');
      results.failed.push('Electron: contextIsolation should be true');
    }
    
    // Check enableRemoteModule
    if (content.includes('enableRemoteModule: false')) {
      log('pass', 'Remote module is disabled');
      results.passed.push('Electron: Remote module disabled');
    } else if (content.includes('enableRemoteModule: true')) {
      log('fail', 'Remote module should be disabled');
      results.failed.push('Electron: enableRemoteModule should be false');
    }
    
    // Check for webSecurity
    if (content.includes('webSecurity: false')) {
      log('fail', 'webSecurity is disabled - major security risk!');
      results.failed.push('Electron: webSecurity should not be false');
    } else {
      log('pass', 'webSecurity is not disabled');
      results.passed.push('Electron: webSecurity default (enabled)');
    }
    
    // Check preload script
    if (content.includes('preload:')) {
      log('pass', 'Using preload script for IPC');
      results.passed.push('Electron: Using preload script');
    } else {
      log('warn', 'No preload script found');
      results.warnings.push('Electron: Consider using preload script');
    }
  } else {
    log('info', 'No Electron main.js found');
  }
}

/**
 * Check 2: Server Security
 */
function checkServerSecurity() {
  section('Server Security');
  
  const serverIndex = path.join(ROOT_DIR, 'server', 'src', 'index.js');
  if (fs.existsSync(serverIndex)) {
    const content = fs.readFileSync(serverIndex, 'utf8');
    
    // Check Helmet
    if (content.includes('helmet')) {
      log('pass', 'Helmet security headers enabled');
      results.passed.push('Server: Helmet middleware');
    } else {
      log('fail', 'Helmet middleware not found');
      results.failed.push('Server: Add helmet for security headers');
    }
    
    // Check CORS
    if (content.includes('cors')) {
      log('pass', 'CORS is configured');
      results.passed.push('Server: CORS configured');
      
      if (content.includes('origin: \'*\'') || content.includes("origin: '*'")) {
        log('fail', 'CORS allows all origins - security risk!');
        results.failed.push('Server: CORS should not allow all origins');
      }
    } else {
      log('warn', 'CORS not configured');
      results.warnings.push('Server: Configure CORS');
    }
    
    // Check Rate Limiting
    if (content.includes('rateLimit') || content.includes('rate-limit')) {
      log('pass', 'Rate limiting configured');
      results.passed.push('Server: Rate limiting enabled');
    } else {
      log('fail', 'No rate limiting found');
      results.failed.push('Server: Add rate limiting');
    }
    
    // Check for body parser limits
    if (content.includes('limit:') || content.includes('"limit"')) {
      log('pass', 'Body parser has size limits');
      results.passed.push('Server: Body size limits configured');
    } else {
      log('warn', 'No explicit body size limits');
      results.warnings.push('Server: Set body parser size limits');
    }
  }
  
  // Check security middleware
  const securityMw = path.join(ROOT_DIR, 'server', 'src', 'middleware', 'security.js');
  if (fs.existsSync(securityMw)) {
    log('pass', 'Custom security middleware exists');
    results.passed.push('Server: Custom security middleware');
  }
}

/**
 * Check 3: Environment Security
 */
function checkEnvSecurity() {
  section('Environment Security');
  
  // Check .env files
  const envFiles = ['.env', 'server/.env'];
  envFiles.forEach(envFile => {
    const envPath = path.join(ROOT_DIR, envFile);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      
      // Check for default/weak secrets
      if (content.includes('change-in-production') || 
          content.includes('your-secret') ||
          content.includes('CHANGE_THIS')) {
        log('warn', `${envFile} may contain placeholder secrets`);
        results.warnings.push(`Environment: ${envFile} has placeholders`);
      }
      
      // Check JWT secret length
      const jwtMatch = content.match(/JWT_SECRET=(.+)/);
      if (jwtMatch && jwtMatch[1].length < 32) {
        log('fail', `${envFile}: JWT_SECRET is too short (< 32 chars)`);
        results.failed.push('Environment: JWT_SECRET should be 32+ chars');
      } else if (jwtMatch) {
        log('pass', `${envFile}: JWT_SECRET has adequate length`);
      }
    }
  });
  
  // Check .gitignore
  const gitignore = path.join(ROOT_DIR, '.gitignore');
  if (fs.existsSync(gitignore)) {
    const content = fs.readFileSync(gitignore, 'utf8');
    if (content.includes('.env')) {
      log('pass', '.env files are in .gitignore');
      results.passed.push('Git: .env files ignored');
    } else {
      log('fail', '.env files not in .gitignore');
      results.failed.push('Git: Add .env to .gitignore');
    }
  }
}

/**
 * Check 4: Dependencies
 */
function checkDependencies() {
  section('Dependency Security');
  
  try {
    log('info', 'Running npm audit...');
    const output = execSync('npm audit --json 2>&1 || true', {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    });
    
    try {
      const audit = JSON.parse(output);
      const vulns = audit.metadata?.vulnerabilities || {};
      
      if (vulns.critical > 0) {
        log('fail', `${vulns.critical} critical vulnerabilities`);
        results.failed.push(`Dependencies: ${vulns.critical} critical vulnerabilities`);
      }
      if (vulns.high > 0) {
        log('fail', `${vulns.high} high vulnerabilities`);
        results.failed.push(`Dependencies: ${vulns.high} high vulnerabilities`);
      }
      if (vulns.moderate > 0) {
        log('warn', `${vulns.moderate} moderate vulnerabilities`);
        results.warnings.push(`Dependencies: ${vulns.moderate} moderate vulnerabilities`);
      }
      if (vulns.low > 0) {
        log('info', `${vulns.low} low vulnerabilities`);
      }
      if (!vulns.critical && !vulns.high && !vulns.moderate) {
        log('pass', 'No significant vulnerabilities found');
        results.passed.push('Dependencies: Clean audit');
      }
    } catch {
      log('info', 'Could not parse npm audit output');
    }
  } catch (e) {
    log('warn', 'npm audit failed to run');
  }
  
  // Check for outdated packages
  try {
    const outdated = execSync('npm outdated --json 2>&1 || true', {
      cwd: ROOT_DIR,
      encoding: 'utf8'
    });
    
    try {
      const packages = JSON.parse(outdated);
      const count = Object.keys(packages).length;
      if (count > 0) {
        log('warn', `${count} packages are outdated`);
        results.warnings.push(`Dependencies: ${count} outdated packages`);
      } else {
        log('pass', 'All packages are up to date');
        results.passed.push('Dependencies: Up to date');
      }
    } catch {
      log('pass', 'All packages are up to date');
    }
  } catch {
    log('info', 'Could not check for outdated packages');
  }
}

/**
 * Check 5: React Security
 */
function checkReactSecurity() {
  section('React Security');
  
  const srcDir = path.join(ROOT_DIR, 'src');
  if (!fs.existsSync(srcDir)) {
    log('info', 'No src directory found');
    return;
  }
  
  let dangerouslySetInnerHTML = 0;
  let evalUsage = 0;
  let documentWrite = 0;
  
  function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('dangerouslySetInnerHTML')) dangerouslySetInnerHTML++;
    if (/\beval\s*\(/.test(content)) evalUsage++;
    if (content.includes('document.write')) documentWrite++;
  }
  
  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && file !== 'node_modules') {
        scanDir(filePath);
      } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.tsx')) {
        scanFile(filePath);
      }
    });
  }
  
  scanDir(srcDir);
  
  if (dangerouslySetInnerHTML > 0) {
    log('warn', `dangerouslySetInnerHTML used ${dangerouslySetInnerHTML} times`);
    results.warnings.push(`React: ${dangerouslySetInnerHTML} dangerouslySetInnerHTML usages`);
  } else {
    log('pass', 'No dangerouslySetInnerHTML usage');
    results.passed.push('React: No dangerous HTML injection');
  }
  
  if (evalUsage > 0) {
    log('fail', `eval() used ${evalUsage} times - security risk!`);
    results.failed.push(`React: Remove ${evalUsage} eval() usages`);
  } else {
    log('pass', 'No eval() usage');
    results.passed.push('React: No eval() usage');
  }
  
  if (documentWrite > 0) {
    log('warn', `document.write used ${documentWrite} times`);
    results.warnings.push(`React: ${documentWrite} document.write usages`);
  }
}

/**
 * Check 6: API Security
 */
function checkAPIRoutes() {
  section('API Route Security');
  
  const routesDir = path.join(ROOT_DIR, 'server', 'src', 'routes');
  if (!fs.existsSync(routesDir)) {
    log('info', 'No routes directory found');
    return;
  }
  
  const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  
  files.forEach(file => {
    const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
    
    // Check for authentication middleware
    if (content.includes('authenticate') || content.includes('auth') || content.includes('jwt')) {
      log('pass', `${file}: Uses authentication`);
    } else if (!file.includes('auth')) {
      log('warn', `${file}: May lack authentication`);
      results.warnings.push(`API: ${file} may need auth middleware`);
    }
    
    // Check for input validation
    if (content.includes('validate') || content.includes('joi') || content.includes('express-validator')) {
      log('pass', `${file}: Has input validation`);
    } else {
      log('warn', `${file}: Consider adding input validation`);
    }
  });
}

/**
 * Check 7: Secure Storage
 */
function checkSecureStorage() {
  section('Secure Storage');
  
  const storageDir = path.join(ROOT_DIR, 'src', 'services', 'storage');
  const secureStorage = path.join(ROOT_DIR, 'src', 'utils', 'secureStorage.js');
  
  if (fs.existsSync(secureStorage)) {
    const content = fs.readFileSync(secureStorage, 'utf8');
    
    if (content.includes('encrypt') || content.includes('crypto')) {
      log('pass', 'Secure storage uses encryption');
      results.passed.push('Storage: Encryption implemented');
    } else {
      log('warn', 'Secure storage may not encrypt data');
      results.warnings.push('Storage: Consider encrypting stored data');
    }
  } else {
    log('info', 'No secureStorage.js found');
  }
  
  // Check for localStorage usage with sensitive data
  const srcDir = path.join(ROOT_DIR, 'src');
  if (fs.existsSync(srcDir)) {
    let localStorageUsage = 0;
    
    function scan(dir) {
      fs.readdirSync(dir).forEach(file => {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory() && file !== 'node_modules') {
          scan(p);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
          const content = fs.readFileSync(p, 'utf8');
          if (content.includes('localStorage.setItem') && 
              (content.includes('token') || content.includes('password') || content.includes('secret'))) {
            localStorageUsage++;
          }
        }
      });
    }
    scan(srcDir);
    
    if (localStorageUsage > 0) {
      log('warn', `${localStorageUsage} files store sensitive data in localStorage`);
      results.warnings.push('Storage: Avoid localStorage for sensitive data');
    } else {
      log('pass', 'No sensitive data in localStorage detected');
    }
  }
}

/**
 * Generate Report
 */
function generateReport() {
  section('SECURITY AUDIT SUMMARY');
  
  const total = results.passed.length + results.warnings.length + results.failed.length;
  const score = Math.round((results.passed.length / total) * 100) || 0;
  
  console.log(`${c.B}Security Score: ${score >= 80 ? c.g : score >= 60 ? c.y : c.r}${score}%${c.x}`);
  console.log();
  console.log(`${c.g}Passed:   ${results.passed.length}${c.x}`);
  console.log(`${c.y}Warnings: ${results.warnings.length}${c.x}`);
  console.log(`${c.r}Failed:   ${results.failed.length}${c.x}`);
  
  if (results.failed.length > 0) {
    console.log(`\n${c.B}${c.r}Critical Issues:${c.x}`);
    results.failed.forEach(f => console.log(`  ${c.r}•${c.x} ${f}`));
  }
  
  if (results.warnings.length > 0) {
    console.log(`\n${c.B}${c.y}Recommendations:${c.x}`);
    results.warnings.forEach(w => console.log(`  ${c.y}•${c.x} ${w}`));
  }
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    score,
    ...results
  };
  
  fs.writeFileSync(
    path.join(ROOT_DIR, 'security-audit-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n${c.b}Report saved to: security-audit-report.json${c.x}\n`);
  
  return results.failed.length === 0;
}

/**
 * Main
 */
function main() {
  console.log(`\n${c.B}${c.m}╔════════════════════════════════════════════════════╗`);
  console.log(`║         NEBULA VPN SECURITY AUDIT                  ║`);
  console.log(`╚════════════════════════════════════════════════════╝${c.x}\n`);
  
  checkElectronSecurity();
  checkServerSecurity();
  checkEnvSecurity();
  checkDependencies();
  checkReactSecurity();
  checkAPIRoutes();
  checkSecureStorage();
  
  const success = generateReport();
  process.exit(success ? 0 : 1);
}

main();
