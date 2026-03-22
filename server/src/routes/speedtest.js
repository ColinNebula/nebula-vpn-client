'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const router = express.Router();

// Speed-test endpoints are intentionally generous with data; rate-limit to
// prevent abuse (max 20 tests per 5 minutes per IP).
const speedtestLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: process.env.NODE_ENV !== 'production' ? 500 : 20,
  message: { error: 'Too many speed-test requests. Please wait a few minutes.' },
  skipSuccessfulRequests: false,
});

router.use(speedtestLimiter);

// ── Ping endpoint ──────────────────────────────────────────────────────────
// Client measures RTT by recording Date.now() before and after the fetch.
// Returns 204 No Content so no JSON-parse overhead skews the measurement.
router.get('/ping', authMiddleware, (req, res) => {
  res.sendStatus(204);
});

// ── Download endpoint ──────────────────────────────────────────────────────
// Streams `bytes` (default 5 MB) of zero-filled data.  The client measures
// elapsed time to compute download throughput.
// Max 20 MB per request to cap server egress.
router.get('/download', authMiddleware, (req, res) => {
  const MAX_BYTES = 20 * 1024 * 1024; // 20 MB safety cap
  const requested = parseInt(req.query.bytes, 10) || 5 * 1024 * 1024;
  const bytes = Math.min(Math.max(1, requested), MAX_BYTES);

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', bytes);
  res.setHeader('Cache-Control', 'no-store');

  // Stream in 64 KB chunks to avoid a single huge allocation
  const CHUNK = 64 * 1024;
  const chunk = Buffer.alloc(CHUNK, 0);
  let remaining = bytes;

  const writeNext = () => {
    while (remaining > 0) {
      const size = Math.min(CHUNK, remaining);
      const toWrite = size === CHUNK ? chunk : Buffer.alloc(size, 0);
      remaining -= size;
      if (remaining === 0) {
        res.end(toWrite);
        return;
      }
      if (!res.write(toWrite)) {
        // Back-pressure: wait for drain before continuing
        res.once('drain', writeNext);
        return;
      }
    }
  };

  writeNext();
});

// ── Upload endpoint ────────────────────────────────────────────────────────
// Client POSTs a binary body; we drain and discard it, then return the
// server-side receipt time so the client can compute upload throughput.
// Max body: 25 MB (enforced separately from the global 10 KB JSON limit).
router.post('/upload', authMiddleware, (req, res) => {
  const MAX_UPLOAD = 25 * 1024 * 1024; // 25 MB
  let received = 0;
  const start = Date.now();

  req.on('data', (chunk) => {
    received += chunk.length;
    if (received > MAX_UPLOAD) {
      logger.warn(`Speed-test upload exceeded ${MAX_UPLOAD} bytes from ${req.ip}`);
      req.destroy();
    }
  });

  req.on('end', () => {
    res.json({ received, elapsed: Date.now() - start });
  });

  req.on('error', () => {
    // Client aborted - no-op
  });
});

module.exports = router;
