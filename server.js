// NIA CKYC 2.0 demo: tiny dependency-free server.
// - serves ./public
// - GET  /api/config  -> non-secret config (appId, workflowId, sdk version)
// - POST /api/token   -> calls HyperVerge's login API with appId + appKey (kept in .env, never sent to the browser)
'use strict';
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---- settings: read from .env on every request, so adding the key needs no restart ----
function readEnvFile() {
  const out = {};
  const file = path.join(__dirname, '.env');
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m || line.trim().startsWith('#')) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}
function settings() {
  const f = readEnvFile(), g = k => (f[k] !== undefined ? f[k] : process.env[k]) || '';
  return {
    APP_ID: g('APP_ID'), APP_KEY: g('APP_KEY'),
    WORKFLOW_ID: g('WORKFLOW_ID') || 'nia_ckyc_individual_demo',
    SDK_VERSION: g('SDK_VERSION') || '11.7.0',
    AUTH_HOST: g('AUTH_HOST') || 'auth-ind.idv.hyperverge.co',
    ACCESS_CODE: g('ACCESS_CODE') // optional: gate the live demo behind a code
  };
}
const PORT = parseInt(process.env.PORT || readEnvFile().PORT || '8787', 10);
const TOKEN_EXPIRY = 14400; // seconds (4 hours, so a long demo never outlives its token)

const PUBLIC = path.join(__dirname, 'docs');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2'
};

// ---- very small per-IP rate limit for the token endpoint ------------------------
const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 60_000, max = 20;
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  arr.push(now); hits.set(ip, arr);
  return arr.length > max;
}

function send(res, code, body, headers = {}) {
  const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(code, Object.assign({ 'Cache-Control': 'no-store' }, typeof body === 'object' && !Buffer.isBuffer(body) ? { 'Content-Type': 'application/json' } : {}, headers));
  res.end(data);
}

function readBody(req, limit = 10_000) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', c => { s += c; if (s.length > limit) { reject(new Error('too large')); req.destroy(); } });
    req.on('end', () => resolve(s));
    req.on('error', reject);
  });
}

function login(transactionId, S) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ appId: S.APP_ID, appKey: S.APP_KEY, expiry: TOKEN_EXPIRY, transactionId, workflowId: S.WORKFLOW_ID });
    const r = https.request({
      host: S.AUTH_HOST, path: '/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }, timeout: 15_000
    }, resp => {
      let s = ''; resp.on('data', c => s += c);
      resp.on('end', () => { try { resolve({ status: resp.statusCode, json: JSON.parse(s) }); } catch (e) { reject(new Error('Bad response from auth service')); } });
    });
    r.on('timeout', () => { r.destroy(new Error('Auth service timed out')); });
    r.on('error', reject);
    r.write(payload); r.end();
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const S = settings();
  const { APP_ID, APP_KEY, WORKFLOW_ID, SDK_VERSION, ACCESS_CODE } = S;
  const ip = (req.headers['cf-connecting-ip'] || req.socket.remoteAddress || '').toString();

  if (url.pathname === '/api/config' && req.method === 'GET') {
    return send(res, 200, {
      appId: APP_ID, workflowId: WORKFLOW_ID, sdkVersion: SDK_VERSION,
      ready: Boolean(APP_ID && APP_KEY), codeRequired: Boolean(ACCESS_CODE)
    });
  }

  if (url.pathname === '/api/token' && req.method === 'POST') {
    if (!APP_ID || !APP_KEY) return send(res, 503, { error: 'not_configured', message: 'Add APP_ID and APP_KEY to the .env file, then refresh this page.' });
    if (limited(ip)) return send(res, 429, { error: 'rate_limited', message: 'Too many requests. Try again in a minute.' });
    let body = {};
    try { body = JSON.parse(await readBody(req) || '{}'); } catch (e) { return send(res, 400, { error: 'bad_request' }); }
    if (ACCESS_CODE) {
      const a = Buffer.from(String(body.code || '')), b = Buffer.from(ACCESS_CODE);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return send(res, 401, { error: 'bad_code', message: 'That access code is not right.' });
    }
    const transactionId = 'nia-demo-' + Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex');
    try {
      const { status, json } = await login(transactionId, S);
      if (status === 200 && json && json.result && json.result.token) {
        return send(res, 200, { token: json.result.token, transactionId, workflowId: WORKFLOW_ID });
      }
      console.error('login failed', status, json && (json.error || json.status));
      return send(res, 502, { error: 'login_failed', message: (json && json.error) || 'Could not get an access token.', status });
    } catch (e) {
      console.error('login error', e.message);
      return send(res, 502, { error: 'login_error', message: 'Could not reach the authentication service.' });
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', { 'Content-Type': 'text/plain' });

  // static files, only from ./public
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain' });
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
    const ext = path.extname(file).toLowerCase();
    send(res, 200, data, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': ['.html', '.js', '.css'].includes(ext) ? 'no-cache' : 'public, max-age=3600' });
  });
});

server.listen(PORT, () => {
  console.log(`\n  NIA CKYC 2.0 demo running on http://localhost:${PORT}`);
  const S = settings();
  console.log(`  Workflow: ${S.WORKFLOW_ID}   App ID: ${S.APP_ID || '(not set)'}   SDK: ${S.SDK_VERSION}`);
  if (!S.APP_ID || !S.APP_KEY) console.log('  ! APP_ID / APP_KEY missing: the page loads, but the live demo needs them in .env (no restart needed after adding)');
  console.log('');
});
