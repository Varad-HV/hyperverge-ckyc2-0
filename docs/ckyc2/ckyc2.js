'use strict';
/* Generic CKYC 2.0 demo front end (HyperVerge). Client name from ?client=Name.
   - story: animated phone mock-ups of the customer journey
   - live: launches the real HyperVerge Web SDK (token from /api/token, appKey never reaches the browser)
   - prefetch: HyperKYCModule.prefetch(appId, workflowId) as soon as the page is open */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const LOGO = 'hv-mark.svg';
const CLIENT = (new URLSearchParams(location.search).get('client') || '').replace(/[^\w .&'-]/g, '').slice(0, 40).trim();
const WHO = CLIENT || 'your team';
const API = (window.NIA_API_BASE || '').replace(/\/$/, '');

/* ================= mini screens ================= */
const STEP_NAMES = {
  exist: ['Get started', 'Find your record', 'Give consent', 'Get your record', 'All done'],
  new: ['Get started', 'Find your record', 'Verify your identity', 'Your details', 'Review and submit']
};
const tick = '<div class="ok-ring"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></div>';
const field = (l, v, ro) => `<div class="field${ro ? ' ro' : ''}"><label>${l}</label><div>${v}</div></div>`;
const opt = (t, s, sel) => `<div class="opt${sel ? ' sel' : ''}"><i class="rd"></i><span>${t}${s ? `<b style="font-weight:400;color:#6b7799;font-size:9.5px;margin-top:1px">${s}</b>` : ''}</span></div>`;
const kv = (a, b) => `<div class="kvm"><span>${a}</span><b>${b}</b></div>`;

function screen(path, step, inner, btn, alt) {
  const names = STEP_NAMES[path];
  const bars = names.map((_, i) => `<i class="${i <= step ? 'f' : ''}"></i>`).join('');
  return `<div class="scr">
    <div class="hd"><img src="${LOGO}" alt=""><s></s></div>
    <div class="prog"><small><b>Step ${step + 1} of 5</b> &nbsp;${names[step]}</small><div>${bars}</div></div>
    ${inner}
    <div class="btnrow">${alt ? `<div class="mbtn alt">${alt}</div>` : ''}${btn ? `<div class="mbtn">${btn}</div>` : ''}</div>
  </div>`;
}

const STORY = {
  exist: [
    { // 1
      card: ['What they see', 'A friendly welcome that explains what is about to happen. No forms yet.', 'Behind the scenes', 'Policy details arrive from your policy system. The journey starts in the right place automatically.'],
      frames: [p => screen(p, 0, `<h5>Verify your KYC</h5><p>We will check if you already have a CKYC record. This takes a few minutes.</p><div class="opt" style="border:0;padding-left:0"><i class="rd" style="border-radius:3px"></i><span>I agree to share my details for KYC verification.</span></div>`, 'Continue')]
    },
    { // 2
      card: ['What they see', 'They confirm their PAN or mobile. A short "checking" moment, then the answer.', 'Behind the scenes', 'CKYC registry search. The name on the record is matched to the policy, so the wrong person never gets a record.'],
      frames: [
        p => screen(p, 1, `<h5>Find your CKYC record</h5><p>Enter your PAN or mobile number.</p>${field('PAN number', 'ABCDE1234F')}<div class="opt sel" style="margin-top:10px"><i class="rd"></i><span>Search with PAN</span></div>${opt('Search with mobile number')}`, 'Find my record'),
        p => screen(p, 1, `<div class="ld"></div><h5>Checking for your CKYC record…</h5><p>This usually takes a few seconds.</p>`)
      ]
    },
    { // 3
      card: ['What they see', 'They choose how to give consent: an OTP, a quick selfie, or a signed form if no phone or email is on record.', 'Behind the scenes', 'OTP to the registered contact, face authentication, or a physical consent form, whichever suits the record.'],
      frames: [
        p => screen(p, 2, `<h5>We found your CKYC record</h5><p>Choose how you want to give consent to fetch it.</p>${opt('Get an OTP', 'Sent to XXXXXX1234 and a***@mail.com', true)}${opt('Verify with a selfie', 'We match your live photo with your record')}`, 'Continue'),
        p => screen(p, 2, `<h5>Enter the OTP</h5><p>We sent a 6 digit OTP to XXXXXX1234 and a***@mail.com.</p><div class="otp"><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i></div>`, 'Verify')
      ]
    },
    { // 4
      card: ['What they see', 'A reassuring progress screen while the record is fetched securely.', 'Behind the scenes', 'Download from the CKYC registry, using the consent just given.'],
      frames: [p => screen(p, 3, `<div class="ld"></div><h5>Fetching your record…</h5><p>Sit tight. We are securely getting your details from the CKYC registry.</p>`)]
    },
    { // 5
      card: ['What they see', 'Their CKYC number and key details. No need to submit any documents again.', 'Behind the scenes', 'Result returned to your systems as Approved, with the CKYC number.'],
      frames: [p => screen(p, 4, `${tick}<h5>Your CKYC record is ready</h5><p>You do not need to submit your documents again.</p>
        <div style="margin-top:10px">${kv('CKYC number', '5000 1234 5678 90')}${kv('Name', 'Priya Sharma')}${kv('Date of birth', '••-••-1992')}${kv('Address', 'Andheri East, Mumbai')}</div>`, 'Done')]
    }
  ],
  new: [
    { // 1
      card: ['What they see', 'The same friendly start for everyone.', 'Behind the scenes', 'Nothing to configure per customer: the journey adapts itself.'],
      frames: [p => screen(p, 0, `<h5>Verify your KYC</h5><p>We will check if you already have a CKYC record. This takes a few minutes.</p><div class="opt" style="border:0;padding-left:0"><i class="rd" style="border-radius:3px"></i><span>I agree to share my details for KYC verification.</span></div>`, 'Continue')]
    },
    { // 2
      card: ['What they see', 'A clear message that there is no record yet, and that they are about to create one.', 'Behind the scenes', 'CKYC registry search returns no match, so the new-customer path begins.'],
      frames: [
        p => screen(p, 1, `<div class="ld"></div><h5>Checking for your CKYC record…</h5><p>This usually takes a few seconds.</p>`),
        p => screen(p, 1, `<h5>No CKYC record yet</h5><p>No problem. We will create one for you. It takes a few minutes, and you only do it once.</p><div class="card"><em>NEXT</em><p>Verify your identity, confirm your details and submit.</p></div>`, "Let's start")
      ]
    },
    { // 3
      card: ['What they see', 'They verify with DigiLocker in one tap, or photograph an ID (front, then back, each with a preview), then confirm their PAN. No selfie is needed.', 'Behind the scenes', 'DigiLocker with Aadhaar consent enforced, or ID reading plus a government database check (passport, voter ID or driving licence). The PAN is checked and the names are matched against the policy.'],
      frames: [
        p => screen(p, 2, `<h5>Let's verify you now</h5><p>Choose how you want to verify.</p>${opt('DigiLocker', 'Fetch your Aadhaar and PAN securely', true)}${opt('Another ID', 'Driving licence, voter ID or passport')}`, 'Continue'),
        p => screen(p, 2, `<h5>Capture the front of your Passport</h5><p>Place the whole card inside the frame. All four corners must be visible.</p><div class="doc">Front side · Step 1 of 2</div>`, 'Take photo'),
        p => screen(p, 2, `<h5>Check the front of your Passport</h5><p>Make sure all four corners are visible and every letter is readable.</p><div class="doc" style="height:110px">Preview of your photo</div>`, 'Use this photo', 'Retake'),
        p => screen(p, 2, `<h5>Capture the back of your Passport</h5><p>Now turn the card over. All four corners must be visible.</p><div class="doc">Back side · Step 2 of 2</div>`, 'Take photo'),
        p => screen(p, 2, `<h5>Add your PAN</h5><p>Enter your PAN number.</p>${field('PAN number', 'ABCDE1234F')}`, 'Continue')
      ]
    },
    { // 4
      card: ['What they see', 'One screen to confirm everything: name, date of birth, address, residential status and family details, all pre-filled from the ID. Anything missing is theirs to fill in.', 'Behind the scenes', 'PAN verification, name matching against the policy, and the ID read are done before this screen, so a failure never comes after a long form.'],
      frames: [
        p => screen(p, 3, `<h5>Confirm your details</h5><p>Check what we fetched and fill in anything missing.</p>
          <div class="card"><em>YOUR NAME</em><div class="row2">${field('First name', 'Priya', 1)}${field('Last name', 'Sharma', 1)}</div></div>
          <div class="card"><em>ABOUT YOU</em>${field('Date of birth', '14-03-1992', 1)}<div class="row2">${field('Gender', 'Female')}${field('Residency', 'Resident')}</div></div>`, 'Confirm'),
        p => screen(p, 3, `<h5>Confirm your details</h5><p>Check what we fetched and fill in anything missing.</p>
          <div class="card"><em>ADDRESS ON YOUR ID</em>${field('House, flat or building', 'A-102, Pramukh Gardens')}<div class="row2">${field('City', 'Silvassa')}${field('PIN', '396230')}</div></div>
          <div class="card"><em>CURRENT ADDRESS</em>${opt('Yes, it is the same', '', true)}</div>`, 'Confirm')
      ]
    },
    { // 5
      card: ['What they see', 'A short declaration, one last review of everything, then it is on its way to the CKYC registry.', 'Behind the scenes', 'The record is uploaded to the CKYC registry. Your systems get the status and the acknowledgement number, and the customer\'s journey ends.'],
      frames: [
        p => screen(p, 4, `<h5>Declaration</h5><p>I confirm that the details I have given are true and correct, and I consent to them being uploaded to the CKYC registry.</p>${field('Place', 'Mumbai')}${field('Date', '21-11-2026')}`, 'Continue'),
        p => screen(p, 4, `<h5>Review your details</h5><p>Check everything before we submit.</p><div style="margin-top:6px">${kv('Name', 'Priya Sharma')}${kv('Date of birth', '14-03-1992')}${kv('ID', 'Passport ••••5678')}${kv('Address', 'Silvassa 396230')}</div>`, 'Submit', 'Edit'),
        p => screen(p, 4, `<div class="ld"></div><h5>Submitting your details…</h5><p>This usually takes a few seconds.</p>`)
      ]
    }
  ]
};

/* ================= hero phone: loops through the existing-record journey ================= */
function buildStack(host, path) {
  host.innerHTML = '';
  const frames = [];
  STORY[path].forEach((st, si) => st.frames.forEach((f, fi) => {
    host.insertAdjacentHTML('beforeend', f(path));
    const el = host.lastElementChild; frames.push({ el, si, fi });
  }));
  return frames;
}
(function heroLoop() {
  const host = $('#heroScreen'); const frames = buildStack(host, 'exist'); let i = 0;
  const show = n => frames.forEach((f, k) => { f.el.classList.toggle('on', k === n); f.el.classList.toggle('out', k < n && k !== n); });
  show(0); setInterval(() => { i = (i + 1) % frames.length; show(i); }, 2600);
})();

/* ================= story ================= */
const story = { path: 'exist', step: 0, frame: 0, timer: null, paused: false, frames: [], visible: false };
function renderStory(path) {
  story.path = path; story.step = 0; story.frame = 0; story.paused = false;
  $('.story').classList.remove('paused');
  story.frames = buildStack($('#storyScreen'), path);
  const ol = $('#steps'); ol.innerHTML = '';
  STEP_NAMES[path].forEach((name, i) => {
    const st = STORY[path][i];
    const li = document.createElement('li');
    li.innerHTML = `<span class="n">${i + 1}</span><div><h4>${name}</h4><p>${st.card[1]}</p></div><div class="bar"><i></i></div>`;
    li.addEventListener('click', () => { story.paused = true; $('.story').classList.add('paused'); clearTimeout(story.timer); goStep(i, 0); });
    ol.appendChild(li);
  });
  goStep(0, 0);
}
function goStep(si, fi) {
  story.step = si; story.frame = fi;
  const st = STORY[story.path][si];
  $$('#steps li').forEach((li, k) => { li.classList.toggle('on', k === si); li.classList.toggle('done', k < si); });
  const idx = story.frames.findIndex(f => f.si === si && f.fi === fi);
  story.frames.forEach((f, k) => { f.el.classList.toggle('on', k === idx); f.el.classList.toggle('out', k < idx); });
  const card = $('#stageCard'); card.classList.add('swap');
  setTimeout(() => { card.innerHTML = `<b>${st.card[0]}</b>${st.card[1]}<br><br><b>${st.card[2]}</b>${st.card[3]}`; card.classList.remove('swap'); }, 220);
  const total = st.frames.length * 2800;
  $('#steps li.on')?.style.setProperty('--dur', total + 'ms');
  const bar = $('#steps li.on .bar i'); if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
  clearTimeout(story.timer);
  if (!story.paused && story.visible) schedule();
}
function schedule() {
  clearTimeout(story.timer);
  story.timer = setTimeout(() => {
    const st = STORY[story.path][story.step];
    if (story.frame + 1 < st.frames.length) return goStep(story.step, story.frame + 1);
    if (story.step + 1 < STORY[story.path].length) return goStep(story.step + 1, 0);
    // finished: switch to the other path
    const next = story.path === 'exist' ? 'new' : 'exist';
    setPath(next);
  }, 2800);
}
function setPath(path) {
  const sw = $('#pathSwitch'); sw.classList.toggle('new', path === 'new');
  $$('#pathSwitch button').forEach(b => b.classList.toggle('on', b.dataset.path === path));
  renderStory(path); if (story.visible) schedule();
}
$$('#pathSwitch button').forEach(b => b.addEventListener('click', () => setPath(b.dataset.path)));
renderStory('exist');
new IntersectionObserver(es => {
  story.visible = es[0].isIntersecting;
  if (story.visible && !story.paused) schedule(); else clearTimeout(story.timer);
}, { threshold: .35 }).observe($('.story'));

/* ================= scenarios ================= */
const SCENARIOS = [
  { b: 'g', badge: 'Existing record', t: 'Get my record with an OTP', d: 'The fastest path: a record is found, consent by OTP (use 123456), and the record is ready.', pan: 'ABCDE1234F' },
  { b: 'g', badge: 'Existing record', t: 'No mobile or email on record', d: 'Consent is given with a signed form that the customer uploads. Shows the physical-consent route.', pan: 'ABCDE1234G' },
  { b: 'w', badge: 'Existing record', t: 'Signed form rejected once', d: 'The first form upload is rejected with clear feedback, the customer uploads again and is accepted.', pan: 'ABCDE1234J' },
  { b: 'b', badge: 'New customer', t: 'Create a new CKYC record', d: 'Verify with DigiLocker or any ID, confirm details on one screen, review and submit.', pan: 'ZZZZZ9999Z' },
  { b: 'b', badge: 'New customer', t: 'Already in CKYC at upload', d: 'A new customer whose record turns up at the final step. The journey tells them they are already covered.', pan: 'AAAAA0000A' },
  { b: 'w', badge: 'Guardrail', t: 'Name does not match', d: 'The name on the record is not the policyholder. See how the guardrail stops it and what the customer is told.', pan: 'ABCDE1234H' }
];
const arrow = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
$('#scenarios').innerHTML = SCENARIOS.map((s, i) => `<button class="sc reveal" style="--d:${(i % 3) * .08}s" data-i="${i}">
  <span class="badge ${s.b}">${s.badge}</span><h4>${s.t}</h4><p>${s.d}</p><span class="go">Launch this journey ${arrow}</span></button>`).join('');

/* ================= helpers ================= */
const toastEl = $('#toast'); let toastT;
function toast(msg, ms = 4200) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), ms); }
$$('[data-scroll]').forEach(b => b.addEventListener('click', () => $(b.dataset.scroll).scrollIntoView({ behavior: 'smooth' })));
const nav = $('#nav'); const onScroll = () => nav.classList.toggle('solid', scrollY > 40); addEventListener('scroll', onScroll, { passive: true }); onScroll();
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
if (location.search.includes('static')) { document.documentElement.classList.add('static'); $$('.reveal').forEach(el => el.classList.add('in')); }
$$('.reveal').forEach((el, i) => { if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i % 4) * .06 + 's'); io.observe(el); });

/* ================= warm-up: fetch what the journey needs before it is asked for ================= */
const WARM_IMAGES = ['4NdD6QF8/progress-1-get-started', 'BQ6rTBwz/progress-2-find-record', 'BQ6rTBwV/progress-3-give-consent', 'SNsB6ftB/progress-3-verify-identity', 'hPjkL136/progress-4-get-record', 'Wb3BGwfQ/progress-4-your-details', 'sDXkY40b/progress-5-all-done', 'zXc90H9p/progress-5-review-submit'].map(p => `https://i.postimg.cc/${p}.png`);
const WARM_SDK = ['ui-bundle/1.0/stable/bundle.core.js', 'ui-bundle/1.0/stable/bundle.core.css', 'ui-bundle/assets/common/bundle.common.Bkg9cn4B.js', 'ui-bundle/assets/dynamic-form/bundle.dynamic-form.CyqHhEEp.js', 'ui-bundle/assets/preload-helper/bundle.preload-helper.C1FmrZbK.js'].map(p => 'https://hv-web-sdk-cdn.hyperverge.co/' + p);
let warmedImages = false, lastBundleWarm = 0;
function warm() {
  if (!warmedImages) { warmedImages = true; WARM_IMAGES.forEach(u => { const i = new Image(); i.decoding = 'async'; i.src = u; }); }
  // the SDK files are only cacheable for 60s, so refresh them shortly before use (on hover/focus of a scenario)
  if (Date.now() - lastBundleWarm > 45000) { lastBundleWarm = Date.now(); WARM_SDK.forEach(u => fetch(u, { mode: 'no-cors' }).catch(() => {})); fetch('https://config-cdn.hyperverge.co/sdk-client-config/hypersnapsdk/v1/default.json', { mode: 'no-cors' }).catch(() => {}); }
}
if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 2500 }); else setTimeout(warm, 1500);
['pointerover', 'focusin', 'touchstart'].forEach(ev => document.addEventListener(ev, e => { if (e.target.closest && e.target.closest('.sc,#startFresh,[data-scroll="#live"]')) warm(); }, { passive: true }));

/* ================= SDK: config, prefetch, launch ================= */
let CFG = null, sdkReady = false, prefetched = false;
const statusEl = $('#prefetchStatus');
function setStatus(kind, text) { statusEl.className = 'status ' + kind; statusEl.querySelector('span').textContent = text; }

function loadSdk(version) {
  return new Promise((res, rej) => {
    // the SDK tag is already in the page (loads in parallel with everything else): just wait for it
    if (window.HyperKYCModule && window.HyperKycConfig) return res();
    const tag = document.getElementById('hvSdk');
    if (tag && version === '11.7.0') {
      let n = 0; const iv = setInterval(() => {
        if (window.HyperKYCModule && window.HyperKycConfig) { clearInterval(iv); res(); }
        else if (++n > 600) { clearInterval(iv); rej(new Error('Could not load the HyperVerge SDK')); }
      }, 100);
      return;
    }
    const s = document.createElement('script');
    s.src = `https://hv-web-sdk-cdn.hyperverge.co/hyperverge-web-sdk@${version}/src/sdk.min.js`;
    s.onload = res; s.onerror = () => rej(new Error('Could not load the HyperVerge SDK'));
    document.head.appendChild(s);
  });
}

async function init() {
  try { const r = await fetch(API + '/api/config'); if (!r.ok) throw new Error('no api'); CFG = await r.json(); }
  catch (e) { CFG = null; setStatus('info', 'Guided preview: the live journey connects in the full demo environment'); return; }
  if (CFG.codeRequired && !sessionStorage.getItem('nia-code-ok')) { /* gate is shown on first launch only */ }
  if (!CFG.ready) { setStatus('err', 'Live journey is waiting for the appKey in the .env file'); return; }
  try {
    await loadSdk(CFG.sdkVersion); sdkReady = true;
    // Prefetch as early as possible: the SDK needs time before launch() (not right before it)
    const t0 = Date.now();
    const done = () => setTimeout(() => { prefetched = true; setStatus('ready', 'Ready to launch'); }, Math.max(0, 3500 - (Date.now() - t0)));
    try { const r = window.HyperKYCModule.prefetch(CFG.appId, CFG.workflowId); Promise.resolve(r).then(done, done); } catch (e) { done(); }
  } catch (e) { setStatus('err', 'Could not load the HyperVerge SDK. Check the connection.'); }
}
init();

function gate() {
  return new Promise(resolve => {
    const g = $('#gate'), input = $('#gateInput'), err = $('#gateErr');
    g.hidden = false; input.value = ''; err.textContent = ''; setTimeout(() => input.focus(), 50);
    const go = () => { const v = input.value.trim(); if (!v) return; g.hidden = true; cleanup(); resolve(v); };
    const key = e => { if (e.key === 'Enter') go(); };
    const cleanup = () => { $('#gateGo').removeEventListener('click', go); input.removeEventListener('keydown', key); };
    $('#gateGo').addEventListener('click', go); input.addEventListener('keydown', key);
  });
}

let launching = false;
async function launch(pan) {
  if (launching) return;
  if (!CFG) { toast('The live journey connects in the full demo environment. Here is the guided walkthrough.', 5200); $('#journey').scrollIntoView({ behavior: 'smooth' }); return; }
  if (!CFG.ready) return toast('Add the appKey to the .env file, then refresh the page, to enable the live journey.', 6000);
  if (!sdkReady) return toast('The HyperVerge SDK is still loading. One moment.');
  launching = true; $$('.sc').forEach(b => b.classList.add('busy')); $('#startFresh').disabled = true;
  const overlay = $('#launching'); overlay.hidden = false;
  try {
    let code = sessionStorage.getItem('nia-code') || '';
    if (CFG.codeRequired && !code) { overlay.hidden = true; code = await gate(); overlay.hidden = false; }
    const r = await fetch(API + '/api/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
    const j = await r.json();
    if (r.status === 401) { sessionStorage.removeItem('nia-code'); throw new Error(j.message || 'Wrong access code'); }
    if (!r.ok) throw new Error(j.message || 'Could not start the journey');
    if (CFG.codeRequired) sessionStorage.setItem('nia-code', code);

    // Inputs the workflow requires: pass "NA" for anything not provided
    const holder = $('#holder').value.trim();
    const inputs = { policyholderName: holder || 'NA', gender: 'NA', dob: 'NA', mobileNumber: 'NA', email: 'NA', panNumber: pan || 'NA' };

    // The journey runs in its own phone-sized frame (journey.html has no site CSS),
    // so nothing from this page can affect the SDK's layout.
    openFrame(`../journey.html#t=${encodeURIComponent(j.token)}&w=${encodeURIComponent(j.workflowId)}&x=${encodeURIComponent(j.transactionId)}&i=${encodeURIComponent(JSON.stringify(inputs))}`);
  } catch (e) {
    overlay.hidden = true; toast(e.message || 'Could not start the journey');
    launching = false; $$('.sc').forEach(b => b.classList.remove('busy')); $('#startFresh').disabled = false;
  }
}
$('#scenarios').addEventListener('click', e => { const b = e.target.closest('.sc'); if (b) launch(SCENARIOS[+b.dataset.i].pan); });
$('#startFresh').addEventListener('click', () => launch(''));

/* ================= journey frame ================= */
const jBack = $('#jBack'), jf = $('#jf');
function openFrame(src) { jf.src = src; jBack.hidden = false; document.body.style.overflow = 'hidden'; }
function closeFrame() { jBack.hidden = true; jf.src = 'about:blank'; document.body.style.overflow = ''; $('#launching').hidden = true; }
addEventListener('message', e => {
  if (e.origin !== location.origin || !e.data) return;
  if (e.data.type === 'nia-started') $('#launching').hidden = true;
  if (e.data.type === 'nia-result') { closeFrame(); onResult(e.data.result); }
});
$('#jClose').addEventListener('click', () => { closeFrame(); onResult({ status: 'user_cancelled', errorCode: 103, errorMessage: 'Workflow cancelled by user' }); });

/* ================= result ================= */
const ICONS = {
  good: '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>',
  warn: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3 2"/></svg>',
  bad: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  neutral: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
};
const OUT = {
  auto_approved: ['good', 'Journey complete', 'The customer is done, and your systems receive an Approved status with the details below.'],
  needs_review: ['warn', 'Sent to the insurer for review', 'The customer was told the insurer will be in touch. Your systems receive a Needs review status to act on.'],
  auto_declined: ['bad', 'Verification not completed', 'The customer could not complete verification within the allowed attempts. Your systems receive a Declined status.'],
  error: ['bad', "We couldn't start the live journey", 'The live connection did not open this time. In a real integration your systems receive the error and the step where it happened. The guided walkthrough above shows the same journey screen by screen.'],
  user_cancelled: ['neutral', 'Journey closed', 'The customer closed the journey before finishing. Your systems are told exactly which step they were on.']
};
function shorten(o) {
  if (Array.isArray(o)) return o.map(shorten);
  if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, shorten(v)]));
  if (typeof o === 'string' && o.length > 90) return o.slice(0, 40) + '… (' + o.length + ' characters)';
  return o;
}
function onResult(res) {
  launching = false; $$('.sc').forEach(b => b.classList.remove('busy')); $('#startFresh').disabled = false; $('#launching').hidden = true;
  const status = (res && res.status) || 'error';
  const [kind, title, text] = OUT[status] || OUT.error;
  const d = (res && res.details) || {};
  $('#sheetIc').className = 'sheet-ic ' + kind; $('#sheetIc').innerHTML = ICONS[kind];
  $('#sheetTitle').textContent = title;
  $('#sheetText').textContent = text;
  $('#sheetAgain').textContent = status === 'error' ? 'Watch the guided walkthrough' : 'Try another scenario';
  $('#sheetAgain').dataset.target = status === 'error' ? '#journey' : '#live';
  const rows = [['Status', status.replace(/_/g, ' ')], ['Transaction', res && (res.TransactionID || res.transactionId)], ['CKYC number', d.ckycNumber], ['Name', d.fullName], ['Journey', d.ckycJourney === 'yes' ? 'Existing record' : (d.ckycJourney === 'no' ? 'New customer' : '')], ['Verified through', d.kycSource], ['Last step', res && res.latestModule]]
    .filter(r => r[1] !== undefined && r[1] !== null && r[1] !== '');
  $('#sheetKv').innerHTML = rows.map(r => `<div><span>${r[0]}</span><b>${String(r[1]).replace(/[<>&]/g, '')}</b></div>`).join('');
  $('#sheetRaw').textContent = JSON.stringify(shorten(res), null, 2);
  $('#sheetBack').hidden = false;
}
const closeSheet = () => { $('#sheetBack').hidden = true; };
$('#sheetClose').addEventListener('click', closeSheet);
$('#sheetAgain').addEventListener('click', () => { closeSheet(); $($('#sheetAgain').dataset.target || '#live').scrollIntoView({ behavior: 'smooth' }); });


/* ================= client personalisation (?client=Kiwi) ================= */
if (CLIENT) {
  document.title = `CKYC 2.0 journey · prepared for ${CLIENT}`;
  $$('[data-client]').forEach(el => { el.textContent = CLIENT; });
  $$('[data-client-show]').forEach(el => { el.hidden = false; });
}

/* ================= consent explorer ================= */
const prog = (path, step, inner, btn, alt) => screen(path, step, inner, btn, alt);
const check = (t, on) => `<div class="opt" style="border:0;padding-left:0"><i class="rd" style="border-radius:3px;${on ? 'background:#0A4DA8;border-color:#0A4DA8;box-shadow:inset 0 0 0 2px #fff' : ''}"></i><span>${t}</span></div>`;
const CONSENTS = [
  { id: 'start', name: 'Start of journey', tag: 'Checkbox', tagc: 'b', path: 'exist',
    sum: 'Before anything is searched, the customer agrees to share their details for KYC.',
    what: 'The customer ticks "I agree to share my details for KYC verification." The Continue button stays disabled until they do.',
    why: 'Permission to look up the CKYC registry with the PAN or mobile number they give.',
    ifno: 'Nothing is searched. They cannot continue until they agree.',
    frames: [p => prog(p, 0, `<h5>Verify your KYC</h5><p>We will check if you already have a CKYC record. This takes a few minutes.</p>${check('I agree to share my details for KYC verification.', false)}`, 'Continue'),
             p => prog(p, 0, `<h5>Verify your KYC</h5><p>We will check if you already have a CKYC record. This takes a few minutes.</p>${check('I agree to share my details for KYC verification.', true)}`, 'Continue')] },
  { id: 'otp', name: 'Consent by OTP', tag: 'OTP', tagc: 'g', path: 'exist',
    sum: 'To download an existing record, the customer proves it is theirs with an OTP.',
    what: 'A 6 digit OTP goes to the mobile number or email already on the CKYC record, with resend and a limit on attempts. Entering it is the consent.',
    why: 'Permission to download the customer’s CKYC record. Only the person who controls the registered contact can give it.',
    ifno: 'Wrong OTP: the customer retries. Attempts or resends used up: the journey ends with a clear "not completed" screen and a Declined status.',
    frames: [p => prog(p, 2, `<h5>We found your CKYC record</h5><p>Choose how you want to give consent to fetch it.</p>${opt('Get an OTP', 'Sent to XXXXXX1234 and a***@mail.com', true)}${opt('Verify with a selfie', 'We match your live photo with your record')}`, 'Continue'),
             p => prog(p, 2, `<h5>Enter the OTP</h5><p>We sent a 6 digit OTP to XXXXXX1234 and a***@mail.com.</p><div class="otp"><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i></div>`, 'Verify'),
             p => prog(p, 3, `<div class="ld"></div><h5>Fetching your record…</h5><p>Using the consent you just gave.</p>`)] },
  { id: 'face', name: 'Consent by selfie', tag: 'Face match', tagc: 'g', path: 'exist',
    sum: 'For customers who prefer not to use an OTP, a live selfie is the consent.',
    what: 'The customer takes a selfie with liveness. Blur, closed eyes, sunglasses and multiple faces are caught. They also confirm one detail from the record (for example a relative’s name).',
    why: 'Permission to download the record, proven by the customer’s face and a detail only they would know.',
    ifno: 'Poor selfie: guided retake. Detail does not match: three tries, then a "not completed" screen.',
    frames: [p => prog(p, 2, `<h5>We found your CKYC record</h5><p>Choose how you want to give consent to fetch it.</p>${opt('Get an OTP', 'Sent to XXXXXX1234 and a***@mail.com')}${opt('Verify with a selfie', 'We match your live photo with your record', true)}`, 'Continue'),
             p => prog(p, 2, `<h5>Take a selfie</h5><p>Look straight at the camera. Remove sunglasses.</p><div class="doc" style="border-radius:50%;width:92px;height:92px;margin:10px auto;display:grid;place-items:center">Face</div>`, 'Capture'),
             p => prog(p, 2, `<h5>Confirm a few details</h5><p>These details help us match you with your CKYC record.</p>${field("Relative's name", 'Ramesh Sharma')}`, 'Verify')] },
  { id: 'form', name: 'Signed consent form', tag: 'Physical', tagc: 'w', path: 'exist',
    sum: 'When the record has no mobile or email, the customer signs a form and uploads a photo.',
    what: 'The journey explains why an OTP is not possible, offers the consent form to download, then asks for a clear photo or scan of the signed form.',
    why: 'Permission to download the record, given in writing where no digital contact exists.',
    ifno: 'Form incomplete or unclear: "We could not accept the form", with a button to upload again. Rejected repeatedly: consent not accepted.',
    frames: [p => prog(p, 2, `<h5>We need your signed consent</h5><p>Your CKYC record does not have a mobile number or email, so we cannot send an OTP.</p><div class="card"><em>HOW IT WORKS</em><p>1. Download the form &nbsp;2. Sign it &nbsp;3. Upload a photo</p></div>`, 'Continue', 'Download form'),
             p => prog(p, 2, `<h5>Upload your signed form</h5><p>Make sure your signature and the full form are visible.</p><div class="doc">Photo of signed form</div>`, 'Submit'),
             p => prog(p, 2, `${tick}<h5>Consent received</h5><p>Thank you. We are fetching your record.</p>`, 'Continue')] },
  { id: 'dgl', name: 'Aadhaar consent (DigiLocker)', tag: 'Enforced', tagc: 'b', path: 'new',
    sum: 'New customers who verify with DigiLocker must allow Aadhaar sharing on the DigiLocker screen.',
    what: 'On the DigiLocker screen the customer signs in with Aadhaar and chooses to share it. If they skip the consent, our screen explains why it is needed.',
    why: 'Permission to fetch the Aadhaar document and its details from DigiLocker.',
    ifno: '"Your consent is needed": try again and allow it, or verify with another ID instead. Aadhaar is never fetched without consent.',
    frames: [p => prog(p, 2, `<h5>Let’s verify you now</h5><p>Choose how you want to verify.</p>${opt('DigiLocker', 'Fetch your Aadhaar and PAN securely', true)}${opt('Another ID', 'Driving licence, voter ID or passport')}`, 'Continue'),
             p => prog(p, 2, `<h5>Allow DigiLocker to share</h5><p>Select Aadhaar and tap Allow on the DigiLocker screen.</p><div class="card"><em>DIGILOCKER</em><p>Aadhaar card &nbsp;✓ Allow</p></div>`, 'Allow'),
             p => prog(p, 2, `<h5>Your consent is needed</h5><p>To fetch your Aadhaar we need you to allow consent. You can try again, or verify with another ID instead.</p>`, 'Try again and allow consent', 'Use another ID')] },
  { id: 'f97', name: 'Form 97 (no PAN)', tag: 'Declaration', tagc: 'w', path: 'new',
    sum: 'A customer without a PAN declares it, instead of being blocked.',
    what: 'The customer ticks a declaration that they do not hold a PAN and are submitting Form 97.',
    why: 'A formal statement that no PAN exists, so the record can still be created.',
    ifno: 'Without the declaration they can go back and enter a PAN instead.',
    frames: [p => prog(p, 2, `<h5>Form 97 declaration</h5><p>Please confirm that you do not hold a PAN.</p>${check('I declare that I do not have a PAN and I am submitting Form 97.', true)}`, 'Continue')] },
  { id: 'decl', name: 'Declaration and upload', tag: 'Final consent', tagc: 'b', path: 'new',
    sum: 'At the end, the customer confirms the details are true and agrees to the upload.',
    what: 'A short declaration with place and date, then a review of everything before Submit.',
    why: 'Permission to upload the record to the CKYC registry, and a statement that the details are correct.',
    ifno: 'They can go back and edit any section. Nothing is uploaded until they confirm.',
    frames: [p => prog(p, 4, `<h5>Declaration</h5><p>I confirm that the details I have given are true and correct, and I consent to them being uploaded to the CKYC registry.</p>${field('Place', 'Mumbai')}${field('Date', '21-11-2026')}`, 'Continue'),
             p => prog(p, 4, `<h5>Review your details</h5><p>Check everything before we submit.</p><div style="margin-top:6px">${kv('Name', 'Priya Sharma')}${kv('ID', 'Passport ••••5678')}${kv('Address', 'Silvassa 396230')}</div>`, 'Submit', 'Edit')] },
  { id: 'no', name: 'When consent is not given', tag: 'Guardrail', tagc: 'w', path: 'exist',
    sum: 'If consent is refused or cannot be accepted, the journey stops safely and says so.',
    what: 'A plain "Consent not accepted" screen explaining that without consent the record cannot be fetched or submitted, with a way to get help.',
    why: 'Nothing is fetched, downloaded or uploaded without consent.',
    ifno: 'This is the "no" path. The insurer receives a clear status and the reason.',
    frames: [p => prog(p, 2, `<h5>Consent not accepted</h5><p>We could not accept your consent. Without it we cannot fetch or submit your CKYC details. Please contact the insurer for help.</p>`, 'Close')] }
];
(function consentExplorer() {
  const list = $('#cList'), host = $('#cScreen'), card = $('#cCard'); if (!list) return;
  let cur = 0, fi = 0, frames = [], timer = null, held = false, vis = false;
  list.innerHTML = CONSENTS.map((c, i) => `<li data-i="${i}"><span class="n">${i + 1}</span><div><h4>${c.name} <span class="ctag ${c.tagc}">${c.tag}</span></h4><p>${c.sum}</p></div><div class="bar"><i></i></div></li>`).join('');
  function show(i) {
    cur = i; fi = 0; const c = CONSENTS[i];
    host.innerHTML = ''; frames = c.frames.map(f => { host.insertAdjacentHTML('beforeend', f(c.path)); return host.lastElementChild; });
    $$('#cList li').forEach((li, k) => { li.classList.toggle('on', k === i); li.classList.toggle('done', false); });
    const li = $('#cList li.on'); li.style.setProperty('--dur', c.frames.length * 2800 + 'ms');
    const bar = $('i', li.querySelector('.bar')); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    card.classList.add('swap');
    setTimeout(() => { card.innerHTML = `<b>What the customer does</b>${c.what}<br><br><b>What they are agreeing to</b>${c.why}<br><br><b>If it is not given</b>${c.ifno}`; card.classList.remove('swap'); }, 200);
    setFrame(0); schedule();
  }
  function setFrame(k) { fi = k; frames.forEach((el, j) => { el.classList.toggle('on', j === k); el.classList.toggle('out', j < k); }); }
  function schedule() {
    clearTimeout(timer); if (held || !vis) return;
    timer = setTimeout(() => { if (fi + 1 < frames.length) { setFrame(fi + 1); schedule(); } else show((cur + 1) % CONSENTS.length); }, 2800);
  }
  list.addEventListener('click', e => { const li = e.target.closest('li'); if (!li) return; held = true; $('#cStage').classList.add('paused'); clearTimeout(timer); show(+li.dataset.i); });
  new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis && !held) schedule(); else clearTimeout(timer); }, { threshold: .3 }).observe($('#cStage'));
  show(0);
})();
