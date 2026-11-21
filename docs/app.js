'use strict';
/* NIA CKYC 2.0 demo front end.
   - story: animated phone mock-ups of the customer journey
   - live: launches the real HyperVerge Web SDK (token from /api/token, appKey never reaches the browser)
   - prefetch: HyperKYCModule.prefetch(appId, workflowId) as soon as the page is open */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const LOGO = 'assets/nia-logo.png';
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
      card: ['What they see', 'A friendly welcome that explains what is about to happen. No forms yet.', 'Behind the scenes', 'Policy details arrive from NIA. The journey starts in the right place automatically.'],
      frames: [p => screen(p, 0, `<h5>Get your CKYC in a few taps</h5><p>We will check if you already have a CKYC record. If you do, you can have it in about two minutes.</p>
        <div class="card"><em>WHAT YOU NEED</em><p>Your PAN or mobile number, and your phone for an OTP.</p></div>`, 'Get started')]
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
        p => screen(p, 2, `<h5>How would you like to give consent?</h5><p>We need your permission to fetch your record.</p>${opt('Get an OTP', 'Sent to XXXXXX1234 and a***@mail.com', true)}${opt('Take a selfie', 'We match your face to the record')}${opt('Upload a signed form', 'If no mobile or email is on record')}`, 'Continue'),
        p => screen(p, 2, `<h5>Enter the OTP</h5><p>We sent a 6-digit code to XXXXXX1234.</p><div class="otp"><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i></div>`, 'Verify')
      ]
    },
    { // 4
      card: ['What they see', 'A reassuring progress screen while the record is fetched securely.', 'Behind the scenes', 'Download from the CKYC registry, using the consent just given.'],
      frames: [p => screen(p, 3, `<div class="ld"></div><h5>Fetching your record…</h5><p>Sit tight. We are securely getting your details from the CKYC registry.</p>`)]
    },
    { // 5
      card: ['What they see', 'Their CKYC number and key details. No need to submit any documents again.', 'Behind the scenes', 'Result returned to NIA as Approved, with the CKYC number.'],
      frames: [p => screen(p, 4, `${tick}<h5>Your CKYC record is ready</h5><p>You do not need to submit your documents again.</p>
        <div style="margin-top:10px">${kv('CKYC number', '5000 1234 5678 90')}${kv('Name', 'Priya Sharma')}${kv('Date of birth', '••-••-1992')}${kv('Address', 'Andheri East, Mumbai')}</div>`, 'Done')]
    }
  ],
  new: [
    { // 1
      card: ['What they see', 'The same friendly start for everyone.', 'Behind the scenes', 'Nothing to configure per customer: the journey adapts itself.'],
      frames: [p => screen(p, 0, `<h5>Get your CKYC in a few taps</h5><p>We will check if you already have a CKYC record. If you do not, we will help you create one.</p>
        <div class="card"><em>WHAT YOU NEED</em><p>Your phone and an ID: Aadhaar through DigiLocker, or a passport, voter ID or driving licence.</p></div>`, 'Get started')]
    },
    { // 2
      card: ['What they see', 'A clear message that there is no record yet, and that they are about to create one.', 'Behind the scenes', 'CKYC registry search returns no match, so the new-customer path begins.'],
      frames: [
        p => screen(p, 1, `<div class="ld"></div><h5>Checking for your CKYC record…</h5><p>This usually takes a few seconds.</p>`),
        p => screen(p, 1, `<h5>No CKYC record yet</h5><p>No problem. We will create one for you. It takes a few minutes, and you only do it once.</p><div class="card"><em>NEXT</em><p>Verify your identity, confirm your details and submit.</p></div>`, "Let's start")
      ]
    },
    { // 3
      card: ['What they see', 'They verify with DigiLocker in one tap, or photograph an ID (front, then back, with a preview), then take a quick selfie.', 'Behind the scenes', 'DigiLocker with Aadhaar consent enforced, or ID reading plus a government database check. Selfie liveness catches blur, closed eyes, sunglasses and extra faces.'],
      frames: [
        p => screen(p, 2, `<h5>Let's verify you now</h5><p>Choose how you want to verify.</p>${opt('DigiLocker', 'Fetch your Aadhaar and PAN securely', true)}${opt('Another ID', 'Driving licence, voter ID or passport')}`, 'Continue'),
        p => screen(p, 2, `<h5>Capture the front of your Passport</h5><p>Place the whole card inside the frame. All four corners must be visible.</p><div class="doc">Front side · Step 1 of 2</div>`, 'Take photo'),
        p => screen(p, 2, `<h5>Take a quick selfie</h5><p>Look straight at the camera in good light.</p><div class="face"></div>`, 'Capture')
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
      card: ['What they see', 'A short declaration, one last review of everything, then it is on its way to the CKYC registry.', 'Behind the scenes', 'The record is uploaded to the CKYC registry. NIA gets the status and the acknowledgement number, and the customer is done.'],
      frames: [
        p => screen(p, 4, `<h5>Declaration</h5><p>I confirm that the details I have given are true and correct, and I consent to them being uploaded to the CKYC registry.</p>${field('Place', 'Mumbai')}${field('Date', '21-11-2026')}`, 'Continue'),
        p => screen(p, 4, `<h5>Review your details</h5><p>Check everything before we submit.</p><div style="margin-top:6px">${kv('Name', 'Priya Sharma')}${kv('Date of birth', '14-03-1992')}${kv('ID', 'Passport ••••5678')}${kv('Address', 'Silvassa 396230')}</div>`, 'Submit', 'Edit'),
        p => screen(p, 4, `${tick}<h5>Details submitted</h5><p>We have sent your details to the CKYC registry.</p>`, 'Done')
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
  { b: 'w', badge: 'Guardrail', t: 'Name does not match', d: 'The name on the record is not the policyholder. See how NIA stops it and what the customer is told.', pan: 'ABCDE1234H' }
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

/* ================= SDK: config, prefetch, launch ================= */
let CFG = null, sdkReady = false, prefetched = false;
const statusEl = $('#prefetchStatus');
function setStatus(kind, text) { statusEl.className = 'status ' + kind; statusEl.querySelector('span').textContent = text; }

function loadSdk(version) {
  return new Promise((res, rej) => {
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

    // token is passed exactly as returned, including the "Bearer " prefix
    const config = new window.HyperKycConfig(j.token, j.workflowId, j.transactionId, false);
    config.setInputs(inputs);
    config.supportDarkMode(false);
    config.setInitialLoaderColor('#00367A');
    config.setDefaultLangCode('en');
    config.setUseLocation(false);
    await window.HyperKYCModule.launch(config, onResult);
    setTimeout(() => { overlay.hidden = true; }, 600);
  } catch (e) {
    overlay.hidden = true; toast(e.message || 'Could not start the journey');
    launching = false; $$('.sc').forEach(b => b.classList.remove('busy')); $('#startFresh').disabled = false;
  }
}
$('#scenarios').addEventListener('click', e => { const b = e.target.closest('.sc'); if (b) launch(SCENARIOS[+b.dataset.i].pan); });
$('#startFresh').addEventListener('click', () => launch(''));

/* ================= result ================= */
const ICONS = {
  good: '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>',
  warn: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3 2"/></svg>',
  bad: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  neutral: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
};
const OUT = {
  auto_approved: ['good', 'Journey complete', 'The customer is done, and NIA receives an Approved status with the details below.'],
  needs_review: ['warn', 'Sent to NIA for review', 'The customer was told NIA will be in touch. NIA receives a Needs review status to act on.'],
  auto_declined: ['bad', 'Verification not completed', 'The customer could not complete verification within the allowed attempts. NIA receives a Declined status.'],
  error: ['bad', "We couldn't start the live journey", 'The live connection did not open this time. In a real integration NIA receives the error and the step where it happened. The guided walkthrough above shows the same journey screen by screen.'],
  user_cancelled: ['neutral', 'Journey closed', 'The customer closed the journey before finishing. NIA is told exactly which step they were on.']
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
