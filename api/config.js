'use strict';
const { settings, cors } = require('./_lib');
module.exports = (req, res) => {
  if (cors(req, res)) return;
  const S = settings();
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ appId: S.APP_ID, workflowId: S.WORKFLOW_ID, sdkVersion: S.SDK_VERSION, ready: Boolean(S.APP_ID && S.APP_KEY), codeRequired: Boolean(S.ACCESS_CODE) });
};
