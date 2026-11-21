// Cloudflare Worker: the token service for the GitHub Pages site.
// Same job as server.js: calls HyperVerge's login API with the appKey (a Worker secret, never in the repo).
//   GET  /api/config -> { appId, workflowId, sdkVersion, ready, codeRequired }
//   POST /api/token  -> { token, transactionId, workflowId }

const TOKEN_EXPIRY = 1800;

function cors(env, req) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.get('Origin') || '';
  const h = { 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' };
  if (allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}
const json = (body, status, headers) => new Response(JSON.stringify(body), { status, headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, headers) });

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const c = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: c });

    if (url.pathname === '/api/config' && req.method === 'GET') {
      return json({ appId: env.APP_ID || '', workflowId: env.WORKFLOW_ID || 'nia_ckyc_individual_demo', sdkVersion: env.SDK_VERSION || '12.0.0',
        ready: Boolean(env.APP_ID && env.APP_KEY), codeRequired: Boolean(env.ACCESS_CODE) }, 200, c);
    }

    if (url.pathname === '/api/token' && req.method === 'POST') {
      if (!env.APP_ID || !env.APP_KEY) return json({ error: 'not_configured', message: 'The token service is not configured yet.' }, 503, c);
      // only the allowed sites may use it from a browser
      const origin = req.headers.get('Origin');
      if (origin && !c['Access-Control-Allow-Origin']) return json({ error: 'forbidden_origin' }, 403, c);
      let body = {}; try { body = await req.json(); } catch (e) { /* empty body is fine */ }
      if (env.ACCESS_CODE && !safeEqual(String(body.code || ''), env.ACCESS_CODE)) return json({ error: 'bad_code', message: 'That access code is not right.' }, 401, c);
      const workflowId = env.WORKFLOW_ID || 'nia_ckyc_individual_demo';
      const transactionId = 'nia-demo-' + Date.now().toString(36) + '-' + crypto.randomUUID().slice(0, 8);
      try {
        const r = await fetch('https://' + (env.AUTH_HOST || 'auth-ind.idv.hyperverge.co') + '/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appId: env.APP_ID, appKey: env.APP_KEY, expiry: TOKEN_EXPIRY, transactionId, workflowId })
        });
        const j = await r.json();
        if (r.status === 200 && j.result && j.result.token) return json({ token: j.result.token, transactionId, workflowId }, 200, c);
        return json({ error: 'login_failed', message: j.error || 'Could not get an access token.' }, 502, c);
      } catch (e) {
        return json({ error: 'login_error', message: 'Could not reach the authentication service.' }, 502, c);
      }
    }
    return json({ error: 'not_found' }, 404, c);
  }
};
