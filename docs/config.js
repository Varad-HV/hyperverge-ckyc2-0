// Where the token service lives. Leave empty when the page is served by server.js (same origin).
// For GitHub Pages, set it to the deployed Worker address, e.g. 'https://nia-ckyc-token.<account>.workers.dev'
window.NIA_API_BASE = (location.hostname.endsWith('github.io') ? 'https://hyperverge-ckyc2-0.vercel.app' : '');
