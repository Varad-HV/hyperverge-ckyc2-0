'use strict';
const https = require('https');
const crypto = require('crypto');
const TOKEN_EXPIRY = 14400;

function settings() {
  const e = process.env;
  return {
    APP_ID: e.APP_ID || '', APP_KEY: e.APP_KEY || '',
    WORKFLOW_ID: e.WORKFLOW_ID || 'nia_ckyc_individual_demo',
    SDK_VERSION: e.SDK_VERSION || '11.7.0',
    AUTH_HOST: e.AUTH_HOST || 'auth-ind.idv.hyperverge.co',
    ACCESS_CODE: e.ACCESS_CODE || ''
  };
}
function login(S, transactionId) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ appId: S.APP_ID, appKey: S.APP_KEY, expiry: TOKEN_EXPIRY, transactionId, workflowId: S.WORKFLOW_ID });
    const r = https.request({ host: S.AUTH_HOST, path: '/login', method: 'POST', timeout: 15000,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, resp => {
      let s = ''; resp.on('data', c => s += c);
      resp.on('end', () => { try { resolve({ status: resp.statusCode, json: JSON.parse(s) }); } catch (e) { reject(new Error('bad response')); } });
    });
    r.on('timeout', () => r.destroy(new Error('timeout'))); r.on('error', reject); r.write(payload); r.end();
  });
}
const ALLOWED = ['https://varad-hv.github.io'];
// Lets the GitHub Pages copy of the site call this service from the browser. Returns true if the request was a preflight and is already answered.
function cors(req, res) {
  const o = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  if (o && ALLOWED.includes(o)) {
    res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}
module.exports = { settings, login, crypto, cors };
