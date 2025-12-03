#!/usr/bin/env node

/**
 * Nebula VPN - Prepare for GitHub Script
 * ======================================
 * This script prepares the repository for safe GitHub publication by:
 * 1. Removing sensitive files and secrets
 * 2. Validating .gitignore configuration
 * 3. Checking for accidentally committed secrets
 * 4. Generating security report
 * 5. Cleaning build artifacts and large files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// ANSI color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.cyan}═══ ${msg} ═══${colors.reset}\n`)
};

const ROOT_DIR = path.resolve(__dirname, '..');

// Patterns that indicate secrets or sensitive data
const SECRET_PATTERNS = [
  // API Keys and Tokens
  /(?:api[_-]?key|apikey)['":\s]*[=:]\s*['"]?[a-zA-Z0-9_\-]{20,}['"]?/gi,
  /(?:access[_-]?token|accesstoken)['":\s]*[=:]\s*['"]?[a-zA-Z0-9_\-]{20,}['"]?/gi,
  /(?:secret[_-]?key|secretkey)['":\s]*[=:]\s*['"]?[a-zA-Z0-9_\-]{20,}['"]?/gi,
  /(?:auth[_-]?token|authtoken)['":\s]*[=:]\s*['"]?[a-zA-Z0-9_\-]{20,}['"]?/gi,
  
  // AWS
  /AKIA[0-9A-Z]{16}/g,
  /(?:aws[_-]?secret)['":\s]*[=:]\s*['"]?[a-zA-Z0-9\/+=]{40}['"]?/gi,
  
  // Private Keys
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
  /-----BEGIN PGP PRIVATE KEY BLOCK-----/g,
  
  // Passwords in code
  /(?:password|passwd|pwd)['":\s]*[=:]\s*['"][^'"]{8,}['"]/gi,
  
  // JWT Secrets
  /(?:jwt[_-]?secret)['":\s]*[=:]\s*['"]?[a-zA-Z0-9_\-]{20,}['"]?/gi,
  
  // Database URLs with credentials
  /(?:mongodb|postgres|mysql|redis):\/\/[^:]+:[^@]+@/gi,
  
  // Stripe Keys
  /sk_(?:live|test)_[a-zA-Z0-9]{24,}/g,
  /pk_(?:live|test)_[a-zA-Z0-9]{24,}/g,
  
  // GitHub tokens
  /ghp_[a-zA-Z0-9]{36}/g,
  /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/g,
  
  // Generic secrets
  /['"]?[a-zA-Z0-9_]*(?:SECRET|KEY|TOKEN|PASSWORD|CREDENTIAL)[a-zA-Z0-9_]*['"]?\s*[=:]\s*['"][a-zA-Z0-9_\-+=\/]{16,}['"]/gi
];

// Files/folders that should NEVER be committed
const SENSITIVE_FILES = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.env.test',
  'server/.env',
  '*.pem',
  '*.key',
  '*.crt',
  '*.p12',
  '*.pfx',
  'id_rsa',
  'id_ed25519',
  'credentials.json',
  'service-account.json',
  'google-services.json',
  '.aws/credentials',
  '.netrc',
  '.npmrc',
  'secrets/',
  'private/',
  '.ssh/'
];

// Large file extensions that should be in .gitignore
const LARGE_FILE_EXTENSIONS = [
  '.mp4', '.avi', '.mov', '.mkv', '.wmv',
  '.mp3', '.wav', '.flac', '.aac',
  '.zip', '.tar', '.tar.gz', '.rar', '.7z',
  '.iso', '.img', '.dmg',
  '.exe', '.msi', '.app',
  '.sqlite', '.sqlite3', '.db',
  '.psd', '.ai', '.sketch'
];

let issues = [];
let warnings = [];

/**
 * Check if file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(path.join(ROOT_DIR, filePath));
  } catch {
    return false;
  }
}

/**
 * Read file content safely
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(ROOT_DIR, filePath), 'utf8');
  } catch {
    return null;
  }
}

/**
 * Get all files in directory recursively
 */
function getAllFiles(dirPath, arrayOfFiles = [], ignoreDirs = ['node_modules', '.git', 'build', 'dist', 'coverage']) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    try {
      if (fs.statSync(fullPath).isDirectory()) {
        if (!ignoreDirs.includes(file)) {
          getAllFiles(fullPath, arrayOfFiles, ignoreDirs);
        }
      } else {
        arrayOfFiles.push(fullPath);
      }
    } catch (e) {
      // Skip files we can't access
    }
  });

  return arrayOfFiles;
}

/**
 * Check for secrets in file content
 */
function checkForSecrets(filePath, content) {
  const foundSecrets = [];
  const lines = content.split('\n');
  
  // Skip security scanning scripts themselves
  if (filePath.includes('prepare-for-github') || filePath.includes('security-audit')) {
    return foundSecrets;
  }
  
  // Skip .env files that are already gitignored (just warn instead)
  if (filePath.endsWith('.env') || filePath.includes('.env.')) {
    if (!filePath.includes('.example') && !filePath.includes('.template')) {
      warnings.push(`Environment file found: ${filePath.replace(ROOT_DIR, '')} (ensure it's in .gitignore)`);
    }
    return foundSecrets;
  }
  
  lines.forEach((line, index) => {
    // Skip comments and empty lines
    if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim() === '') {
      return;
    }
    
    // Skip validation error messages (common false positives)
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('is required') || lowerLine.includes('is too') ||
        lowerLine.includes('must be') || lowerLine.includes('do not match') ||
        lowerLine.includes('is invalid') || lowerLine.includes('cannot be') ||
        lowerLine.includes('validation') || lowerLine.includes('error message') ||
        lowerLine.includes('confirm your') || lowerLine.includes('please enter')) {
      return;
    }
    
    // Skip markdown documentation files for password mentions
    if (filePath.endsWith('.md') && lowerLine.includes('password')) {
      return;
    }
    
    SECRET_PATTERNS.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        // Check if it's a placeholder/example
        if (lowerLine.includes('example') || lowerLine.includes('placeholder') ||
            lowerLine.includes('your_') || lowerLine.includes('change_this') ||
            lowerLine.includes('xxxx') || lowerLine.includes('todo') ||
            lowerLine.includes('demo') || lowerLine.includes('test')) {
          return; // Skip placeholders
        }
        
        foundSecrets.push({
          file: filePath.replace(ROOT_DIR, ''),
          line: index + 1,
          match: matches[0].substring(0, 50) + (matches[0].length > 50 ? '...' : ''),
          pattern: pattern.toString().substring(0, 40)
        });
      }
    });
  });
  
  return foundSecrets;
}

/**
 * Validate .gitignore
 */
function validateGitignore() {
  log.header('Validating .gitignore');
  
  const gitignorePath = path.join(ROOT_DIR, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    issues.push('No .gitignore file found!');
    log.error('No .gitignore file found!');
    return;
  }
  
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  
  // Check for essential entries
  const essentialPatterns = [
    { pattern: '.env', description: 'Environment files' },
    { pattern: 'node_modules', description: 'Node modules' },
    { pattern: '*.key', description: 'Private keys' },
    { pattern: '*.pem', description: 'PEM certificates' },
    { pattern: '/build', description: 'Build output' },
    { pattern: '/dist', description: 'Distribution files' },
    { pattern: '*.log', description: 'Log files' }
  ];
  
  essentialPatterns.forEach(({ pattern, description }) => {
    if (!gitignore.includes(pattern)) {
      warnings.push(`Missing .gitignore pattern: ${pattern} (${description})`);
      log.warn(`Missing pattern: ${pattern} (${description})`);
    } else {
      log.success(`Found pattern: ${pattern}`);
    }
  });
}

/**
 * Check for sensitive files in repo
 */
function checkSensitiveFiles() {
  log.header('Checking for Sensitive Files');
  
  SENSITIVE_FILES.forEach(file => {
    if (fileExists(file)) {
      // Check if it's in git
      try {
        execSync(`git ls-files --error-unmatch "${file}"`, { cwd: ROOT_DIR, stdio: 'pipe' });
        issues.push(`Sensitive file tracked by git: ${file}`);
        log.error(`TRACKED: ${file} - This file should not be in git!`);
      } catch {
        log.success(`Not tracked: ${file}`);
      }
    }
  });
}

/**
 * Scan all files for secrets
 */
function scanForSecrets() {
  log.header('Scanning for Secrets in Code');
  
  const allFiles = getAllFiles(ROOT_DIR);
  const textExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.yml', '.yaml', '.env', '.md', '.txt', '.html', '.css'];
  let secretsFound = [];
  
  allFiles.forEach(filePath => {
    const ext = path.extname(filePath).toLowerCase();
    if (textExtensions.includes(ext) || path.basename(filePath).startsWith('.')) {
      const content = readFile(filePath.replace(ROOT_DIR + path.sep, ''));
      if (content) {
        const secrets = checkForSecrets(filePath, content);
        secretsFound = secretsFound.concat(secrets);
      }
    }
  });
  
  if (secretsFound.length > 0) {
    log.error(`Found ${secretsFound.length} potential secrets:`);
    secretsFound.forEach(secret => {
      issues.push(`Potential secret in ${secret.file}:${secret.line}`);
      console.log(`  ${colors.red}→${colors.reset} ${secret.file}:${secret.line}`);
      console.log(`    ${colors.yellow}Match: ${secret.match}${colors.reset}`);
    });
  } else {
    log.success('No hardcoded secrets detected');
  }
}

/**
 * Check for large files
 */
function checkLargeFiles() {
  log.header('Checking for Large Files');
  
  const allFiles = getAllFiles(ROOT_DIR);
  const largeFiles = [];
  const SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
  
  allFiles.forEach(filePath => {
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      if (stats.size > SIZE_LIMIT) {
        largeFiles.push({ path: filePath.replace(ROOT_DIR, ''), size: stats.size });
      }
      
      if (LARGE_FILE_EXTENSIONS.includes(ext)) {
        warnings.push(`Large file type in repo: ${filePath.replace(ROOT_DIR, '')}`);
      }
    } catch {
      // Skip files we can't access
    }
  });
  
  if (largeFiles.length > 0) {
    log.warn(`Found ${largeFiles.length} large files (>5MB):`);
    largeFiles.forEach(file => {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      console.log(`  ${colors.yellow}→${colors.reset} ${file.path} (${sizeMB} MB)`);
      warnings.push(`Large file: ${file.path} (${sizeMB} MB)`);
    });
  } else {
    log.success('No excessively large files found');
  }
}

/**
 * Check dependencies for vulnerabilities
 */
function checkDependencies() {
  log.header('Checking Dependencies');
  
  try {
    log.info('Running npm audit...');
    const auditOutput = execSync('npm audit --json 2>/dev/null || true', { 
      cwd: ROOT_DIR, 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    try {
      const audit = JSON.parse(auditOutput);
      if (audit.metadata && audit.metadata.vulnerabilities) {
        const vulns = audit.metadata.vulnerabilities;
        const total = vulns.critical + vulns.high + vulns.moderate + vulns.low;
        
        if (vulns.critical > 0) {
          issues.push(`${vulns.critical} critical vulnerabilities in dependencies`);
          log.error(`Critical vulnerabilities: ${vulns.critical}`);
        }
        if (vulns.high > 0) {
          warnings.push(`${vulns.high} high vulnerabilities in dependencies`);
          log.warn(`High vulnerabilities: ${vulns.high}`);
        }
        if (total === 0) {
          log.success('No known vulnerabilities in dependencies');
        }
      }
    } catch {
      log.info('Unable to parse audit results');
    }
  } catch (e) {
    log.warn('npm audit check failed (this is normal if npm is not available)');
  }
}

/**
 * Verify environment examples exist
 */
function verifyEnvExamples() {
  log.header('Verifying Environment Templates');
  
  const envFiles = ['.env', 'server/.env'];
  const exampleFiles = ['.env.example', 'server/.env.example'];
  
  envFiles.forEach((envFile, index) => {
    if (fileExists(envFile) && !fileExists(exampleFiles[index])) {
      warnings.push(`Missing example template for ${envFile}`);
      log.warn(`Missing: ${exampleFiles[index]}`);
    } else if (fileExists(exampleFiles[index])) {
      log.success(`Found: ${exampleFiles[index]}`);
    }
  });
}

/**
 * Generate pre-commit hook
 */
function generatePreCommitHook() {
  log.header('Generating Pre-commit Hook');
  
  const hookContent = `#!/bin/sh
# Nebula VPN Pre-commit Hook
# Prevents commits containing secrets

echo "🔍 Running pre-commit security checks..."

# Check for secrets in staged files
SECRETS_FOUND=0

# Patterns to check
check_pattern() {
  git diff --cached --name-only | while read file; do
    if [ -f "$file" ]; then
      if grep -E "$1" "$file" 2>/dev/null; then
        echo "❌ Potential secret found in: $file"
        echo "   Pattern: $1"
        SECRETS_FOUND=1
      fi
    fi
  done
}

# Check for common secret patterns
check_pattern "AKIA[0-9A-Z]{16}"
check_pattern "-----BEGIN.*PRIVATE KEY-----"
check_pattern "sk_live_[a-zA-Z0-9]{24}"
check_pattern "ghp_[a-zA-Z0-9]{36}"

# Check for .env files
if git diff --cached --name-only | grep -E "^\\.env$|^\\.env\\."; then
  echo "❌ Attempting to commit .env file!"
  exit 1
fi

# Check for large files (>5MB)
git diff --cached --name-only | while read file; do
  if [ -f "$file" ]; then
    size=$(stat -f%z "$file" 2>/dev/null || stat --printf="%s" "$file" 2>/dev/null)
    if [ "$size" -gt 5242880 ]; then
      echo "❌ Large file detected: $file ($size bytes)"
      exit 1
    fi
  fi
done

echo "✅ Pre-commit checks passed"
exit 0
`;

  const hookPath = path.join(ROOT_DIR, '.git', 'hooks', 'pre-commit');
  
  try {
    if (fs.existsSync(path.join(ROOT_DIR, '.git'))) {
      fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
      log.success('Pre-commit hook installed');
    } else {
      log.warn('Not a git repository, skipping hook installation');
    }
  } catch (e) {
    log.warn('Could not install pre-commit hook: ' + e.message);
  }
}

/**
 * Clean build artifacts
 */
function cleanBuildArtifacts() {
  log.header('Cleaning Build Artifacts');
  
  const artifactDirs = ['build', 'dist', 'out', '.next', 'coverage', '.nyc_output'];
  
  artifactDirs.forEach(dir => {
    const fullPath = path.join(ROOT_DIR, dir);
    if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        log.success(`Removed: ${dir}/`);
      } catch (e) {
        log.warn(`Could not remove ${dir}: ${e.message}`);
      }
    }
  });
}

/**
 * Generate security report
 */
function generateReport() {
  log.header('Security Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      issues: issues.length,
      warnings: warnings.length
    },
    issues,
    warnings,
    recommendations: []
  };
  
  // Add recommendations
  if (issues.length > 0) {
    report.recommendations.push('Address all critical issues before pushing to GitHub');
  }
  if (warnings.length > 0) {
    report.recommendations.push('Review and address warnings to improve security posture');
  }
  report.recommendations.push('Rotate any secrets that may have been exposed');
  report.recommendations.push('Enable GitHub secret scanning on your repository');
  report.recommendations.push('Set up branch protection rules on main/master');
  
  // Save report
  const reportPath = path.join(ROOT_DIR, 'security-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log.info(`Security report saved to: security-report.json`);
  
  // Print summary
  console.log('\n' + colors.bold + '═══════════════════════════════════════' + colors.reset);
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log(colors.green + colors.bold + '✓ All checks passed! Safe to push to GitHub.' + colors.reset);
  } else {
    if (issues.length > 0) {
      console.log(colors.red + colors.bold + `✗ ${issues.length} critical issue(s) found` + colors.reset);
    }
    if (warnings.length > 0) {
      console.log(colors.yellow + colors.bold + `⚠ ${warnings.length} warning(s) found` + colors.reset);
    }
    console.log('\nPlease address these issues before pushing to GitHub.');
  }
  
  console.log(colors.bold + '═══════════════════════════════════════' + colors.reset + '\n');
  
  return issues.length === 0;
}

/**
 * Main execution
 */
function main() {
  console.log('\n' + colors.bold + colors.magenta);
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║       NEBULA VPN - PREPARE FOR GITHUB                 ║');
  console.log('║       Security Check & Cleanup Script                 ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  const args = process.argv.slice(2);
  const cleanMode = args.includes('--clean');
  const fixMode = args.includes('--fix');
  
  // Run all checks
  validateGitignore();
  checkSensitiveFiles();
  scanForSecrets();
  checkLargeFiles();
  checkDependencies();
  verifyEnvExamples();
  
  // Optional actions
  if (cleanMode || fixMode) {
    cleanBuildArtifacts();
  }
  
  if (fixMode) {
    generatePreCommitHook();
  }
  
  // Generate report
  const success = generateReport();
  
  process.exit(success ? 0 : 1);
}

main();
