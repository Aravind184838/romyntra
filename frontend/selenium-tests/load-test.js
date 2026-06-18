/**
 * load-test.js — Baseline/Load Test for Romyntra API
 * ─────────────────────────────────────────────────────────────────────────
 * Uses Node.js built-in http/https to simulate concurrent virtual users.
 * No external dependencies required — runs with plain Node.js.
 *
 * Targets:
 *   - GET  /api/health         (public)
 *   - POST /api/auth/login     (public)
 *   - GET  /api/users/profile  (auth-required → expects 401)
 *
 * Configuration (via env vars):
 *   LOAD_API_URL      API base URL (default: http://localhost:5000/api)
 *   LOAD_USERS        Concurrent virtual users (default: 100)
 *   LOAD_DURATION_MS  Test duration in ms (default: 60000 = 1 minute)
 *   LOAD_RAMP_MS      Ramp-up period in ms (default: 5000)
 *
 * Usage:
 *   node load-test.js
 *   LOAD_USERS=50 LOAD_DURATION_MS=30000 node load-test.js
 * ─────────────────────────────────────────────────────────────────────────
 */
'use strict';

const http  = require('http');
const https = require('https');
const { URL } = require('url');

// ── Configuration ─────────────────────────────────────────────────────────────
const API_URL     = (process.env.LOAD_API_URL     || 'http://localhost:5000/api').replace(/\/$/, '');
const USERS       = parseInt(process.env.LOAD_USERS        || '100',  10);
const DURATION_MS = parseInt(process.env.LOAD_DURATION_MS  || '60000', 10);
const RAMP_MS     = parseInt(process.env.LOAD_RAMP_MS      || '5000',  10);

// ── Metrics ───────────────────────────────────────────────────────────────────
const metrics = {
  total:       0,
  success:     0,
  failure:     0,
  durations:   [],   // array of response times in ms
  statusCodes: {},
  errors:      [],
};

// ── HTTP Request Helper ───────────────────────────────────────────────────────
function request(method, urlStr, body = null) {
  return new Promise((resolve) => {
    const start   = Date.now();
    const parsed  = new URL(urlStr);
    const lib     = parsed.protocol === 'https:' ? https : http;

    const headers = { 'Content-Type': 'application/json' };
    const payload = body ? JSON.stringify(body) : null;
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = lib.request(
      { method, hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search, headers },
      (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          const ms = Date.now() - start;
          resolve({ status: res.statusCode, ms, ok: res.statusCode < 500 });
        });
      }
    );
    req.on('error', (e) => {
      resolve({ status: 0, ms: Date.now() - start, ok: false, error: e.message });
    });
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ status: 0, ms: 10000, ok: false, error: 'timeout' });
    });
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Scenarios (round-robin) ───────────────────────────────────────────────────
const SCENARIOS = [
  // Scenario 1: Health check (lightest)
  async () => request('GET', `${API_URL}/health`),

  // Scenario 2: Invalid login (exercises auth controller)
  async () => request('POST', `${API_URL}/auth/login`, {
    email:    'loadtest@nowhere.com',
    password: 'WrongPass999!'
  }),

  // Scenario 3: Unauthenticated protected endpoint (exercises middleware)
  async () => request('GET', `${API_URL}/users/profile`),

  // Scenario 4: Invalid register (exercises validator)
  async () => request('POST', `${API_URL}/auth/register`, {
    email: 'bad-email'
  }),
];

// ── Virtual User ──────────────────────────────────────────────────────────────
async function virtualUser(userId, endTime) {
  let reqIdx = userId % SCENARIOS.length;
  while (Date.now() < endTime) {
    const scenario = SCENARIOS[reqIdx % SCENARIOS.length];
    reqIdx++;
    const result = await scenario();
    metrics.total++;
    metrics.durations.push(result.ms);
    const code = String(result.status || 'ERR');
    metrics.statusCodes[code] = (metrics.statusCodes[code] || 0) + 1;
    if (result.ok || result.status === 400 || result.status === 401 || result.status === 422) {
      metrics.success++;
    } else {
      metrics.failure++;
      if (result.error) metrics.errors.push(result.error);
    }
  }
}

// ── Statistics ────────────────────────────────────────────────────────────────
function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function printReport(durationSec) {
  const sorted  = [...metrics.durations].sort((a, b) => a - b);
  const avg     = sorted.reduce((s, v) => s + v, 0) / (sorted.length || 1);
  const rps     = (metrics.total / durationSec).toFixed(1);
  const errRate = ((metrics.failure / (metrics.total || 1)) * 100).toFixed(1);

  const PASS = metrics.failure === 0 || parseFloat(errRate) < 5;

  console.log('\n' + '═'.repeat(56));
  console.log('  📊  ROMYNTRA LOAD TEST REPORT');
  console.log('═'.repeat(56));
  console.log(`  Target API     : ${API_URL}`);
  console.log(`  Virtual Users  : ${USERS}`);
  console.log(`  Duration       : ${durationSec}s`);
  console.log('─'.repeat(56));
  console.log('  THROUGHPUT');
  console.log(`    Requests/sec : ${rps} req/s`);
  console.log(`    Total Reqs   : ${metrics.total}`);
  console.log('─'.repeat(56));
  console.log('  RESPONSE TIMES');
  console.log(`    Min          : ${sorted[0] || 0}ms`);
  console.log(`    Average      : ${avg.toFixed(0)}ms`);
  console.log(`    Median (p50) : ${percentile(sorted, 50)}ms`);
  console.log(`    p90          : ${percentile(sorted, 90)}ms`);
  console.log(`    p95          : ${percentile(sorted, 95)}ms`);
  console.log(`    p99          : ${percentile(sorted, 99)}ms`);
  console.log(`    Max          : ${sorted[sorted.length - 1] || 0}ms`);
  console.log('─'.repeat(56));
  console.log('  RESULTS');
  console.log(`    Success      : ${metrics.success} (${(100 - parseFloat(errRate)).toFixed(1)}%)`);
  console.log(`    Failure      : ${metrics.failure} (${errRate}%)`);
  console.log('─'.repeat(56));
  console.log('  STATUS CODES');
  for (const [code, count] of Object.entries(metrics.statusCodes).sort()) {
    console.log(`    HTTP ${code}     : ${count}`);
  }
  console.log('─'.repeat(56));
  console.log(`  VERDICT        : ${PASS ? '✅ PASS' : '❌ FAIL (error rate ≥ 5%)'}`);
  console.log('═'.repeat(56) + '\n');

  return PASS;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Starting load test: ${USERS} users × ${DURATION_MS / 1000}s`);
  console.log(`   Target: ${API_URL}\n`);

  const startTime = Date.now();
  const endTime   = startTime + DURATION_MS;
  const promises  = [];

  for (let i = 0; i < USERS; i++) {
    // Stagger start over the ramp period
    const delay = (RAMP_MS / USERS) * i;
    promises.push(
      new Promise(res => setTimeout(res, delay))
        .then(() => virtualUser(i, endTime))
    );
  }

  // Progress ticker
  const ticker = setInterval(() => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    process.stdout.write(`\r  ⏱  Elapsed: ${elapsed}s | Requests: ${metrics.total} | RPS: ${(metrics.total / (elapsed || 1)).toFixed(0)}`);
  }, 1000);

  await Promise.all(promises);
  clearInterval(ticker);
  process.stdout.write('\n');

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const passed = printReport(parseFloat(durationSec));

  process.exit(passed ? 0 : 1);
}

main().catch(err => {
  console.error('Load test crashed:', err);
  process.exit(1);
});
