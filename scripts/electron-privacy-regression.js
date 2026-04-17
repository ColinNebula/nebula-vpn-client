#!/usr/bin/env node

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const electronBinary = require('electron');
const TIMEOUT_MS = 30000;

function createProbeServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Electron Privacy Regression Probe</title>
  </head>
  <body>
    <main>
      <h1>Electron Privacy Regression Probe</h1>
      <p>This page is loaded only for automated geolocation and WebRTC leak checks.</p>
    </main>
  </body>
</html>`);
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

async function main() {
  const { server, url } = await createProbeServer();
  const electronEntry = path.join(ROOT_DIR, 'public', 'electron.js');

  let stdout = '';
  let stderr = '';

  try {
    const child = spawn(electronBinary, [electronEntry], {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        ELECTRON_PRIVACY_REGRESSION: '1',
        ELECTRON_PRIVACY_REGRESSION_URL: url,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const timer = setTimeout(() => {
      child.kill();
    }, TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      process.stdout.write(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });

    const exitCode = await new Promise((resolve, reject) => {
      child.on('error', reject);
      child.on('exit', (code) => {
        clearTimeout(timer);
        resolve(code ?? 1);
      });
    });

    const combined = `${stdout}\n${stderr}`;
    const match = combined.match(/\[privacy-regression\]\s+(\{.*\})/);
    if (!match) {
      console.error('Electron privacy regression check did not produce a result payload.');
      process.exitCode = 1;
      return;
    }

    const result = JSON.parse(match[1]);
    if (exitCode !== 0 || !result.pass) {
      console.error('Electron privacy regression check failed.');
      if (result.geolocation?.allowed) {
        console.error('Geolocation unexpectedly succeeded.');
      }
      if (Array.isArray(result.webRtc?.candidateIps) && result.webRtc.candidateIps.length > 0) {
        console.error(`WebRTC exposed numeric candidates: ${result.webRtc.candidateIps.join(', ')}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log('Electron privacy regression check passed.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error('Electron privacy regression check crashed:', error.message);
  process.exit(1);
});