'use strict';
const { settings, login, crypto, cors } = require('./_lib');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const S = settings();
  if (!S.APP_ID || !S.APP_KEY) return res.status(503).json({ error: 'not_configured', message: 'The token service is not configured yet.' });
  const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch (e) { return {}; } })() : (req.body || {});
  if (S.ACCESS_CODE) {
    const a = Buffer.from(String(body.code || '')), b = Buffer.from(S.ACCESS_CODE);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'bad_code', message: 'That access code is not right.' });
  }
  const transactionId = 'nia-demo-' + Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex');
  try {
    const { status, json } = await login(S, transactionId);
    if (status === 200 && json && json.result && json.result.token) return res.status(200).json({ token: json.result.token, transactionId, workflowId: S.WORKFLOW_ID });
    return res.status(502).json({ error: 'login_failed', message: (json && json.error) || 'Could not get an access token.' });
  } catch (e) {
    return res.status(502).json({ error: 'login_error', message: 'Could not reach the authentication service.' });
  }
};
