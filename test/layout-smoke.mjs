/**
 * Desktop and phone layout. Saves one PNG per viewport and fails on overflow
 * or controls that sit outside the screen.
 *   node test/layout-smoke.mjs
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = 8766;
const CDP_PORT = 9334;
const PAGE = `http://127.0.0.1:${PORT}/index.html`;
const FILE_PAGE = pathToFileURL(path.join(ROOT, 'index.html')).href;
const OUT = '/opt/cursor/artifacts';
mkdirSync(OUT, { recursive: true });

const VIEWS = [
  { name: '1280x720', w: 1280, h: 720, mobile: false },
  { name: '390x844-portrait', w: 390, h: 844, mobile: true },
  { name: '844x390-landscape', w: 844, h: 390, mobile: true },
  { name: '768x1024', w: 768, h: 1024, mobile: true }
];

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe']
});
const chrome = spawn('google-chrome', [
  '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
  '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files',
  '--autoplay-policy=no-user-gesture-required', '--window-size=1280,720',
  `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=/tmp/vv-layout-${process.pid}`,
  'about:blank'
], { stdio: 'ignore' });

const problems = [];
function shutdown(code) {
  chrome.kill('SIGKILL');
  server.kill('SIGKILL');
  process.exit(code);
}

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (this.onEvent) this.onEvent(msg);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
    });
  }
}

async function waitJson(url) {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
    } catch (_) {}
    await delay(200);
  }
  throw new Error('chrome debug port did not open');
}

const AUDIT = `(screen) => {
  const inside = (r) => r.width > 0 && r.height > 0 && r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
  const shown = (el) => {
    if (!el || el.closest('[hidden]')) return false;
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length > 0;
  };
  const ids = {
    title: ['#arcade', '#practice', '#sound', '#moves', '[data-arena="opera"]', '[data-arena="glasshouse"]'],
    select: ['#begin', '#sel-back', '[data-pick="cory"]', '[data-pick="bob"]'],
    battle: ['#hud0', '#hud1', '#clock', '#pause', '#canvas']
  }[screen];
  const off = [];
  for (const sel of ids) {
    const el = document.querySelector(sel);
    if (!shown(el)) { off.push(sel + ' hidden'); continue; }
    const r = el.getBoundingClientRect();
    if (!inside(r)) off.push(sel + ' ' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.right) + ',' + Math.round(r.bottom));
  }
  const touch = document.querySelector('.touchpad');
  const touchOn = shown(touch);
  if (screen === 'battle' && touchOn) {
    for (const el of touch.querySelectorAll('button')) {
      const r = el.getBoundingClientRect();
      if (!inside(r)) off.push('touch ' + (el.getAttribute('aria-label') || el.textContent) );
    }
  }
  const canvas = document.querySelector('#canvas');
  const cap = document.querySelector('#caption');
  let caption = null;
  if (screen === 'battle' && cap) {
    if (!cap.textContent) {
      cap.textContent = 'Cory · The opera house will talk. Let them.';
      cap.dataset.who = 'cory';
    }
    const r = cap.getBoundingClientRect();
    const hud = document.querySelector('#hud0').getBoundingClientRect();
    const canvasBox = canvas.getBoundingClientRect();
    caption = {
      text: cap.textContent,
      font: parseFloat(getComputedStyle(cap).fontSize),
      top: r.top,
      bottom: r.bottom,
      overHud: r.top < hud.bottom - 1,
      overFighters: r.top < canvasBox.bottom - 2,
      off: !inside(r)
    };
    if (touchOn && r.bottom > touch.getBoundingClientRect().top + 1) caption.overTouch = true;
  }
  return {
    scrollW: document.documentElement.scrollWidth,
    scrollH: document.documentElement.scrollHeight,
    innerW: innerWidth,
    innerH: innerHeight,
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    overflowY: document.documentElement.scrollHeight > innerHeight + 1,
    off,
    canvasH: canvas ? canvas.clientHeight : 0,
    touchOn,
    caption
  };
}`;

try {
  await delay(300);
  const ver = await waitJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject); });
  const cdp = new CDP(ws);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params) => cdp.send(method, params, sessionId);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.addEventListener('blur', function (e) { e.stopImmediatePropagation(); }, true);`
  });
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  const evalJson = async (expression) => {
    const ran = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (ran.exceptionDetails) {
      const ex = ran.exceptionDetails;
      throw new Error(ex.exception?.description || ex.text || JSON.stringify(ex));
    }
    return ran.result.value;
  };
  const boot = `(() => {
    window.addEventListener('blur', e => e.stopImmediatePropagation(), true);
    const Orig = window.VelvetDuel;
    function Wrapped(...args) { const d = new Orig(...args); window.__duel = d; return d; }
    Wrapped.prototype = Orig.prototype;
    window.VelvetDuel = Wrapped;
    const orig = HTMLAudioElement.prototype.play;
    HTMLAudioElement.prototype.play = function () {
      (window.__played = window.__played || []).push(String(this.currentSrc || this.src || ''));
      try { const p = orig.apply(this, arguments); if (p && p.catch) p.catch(() => {}); return p; }
      catch (err) { return Promise.resolve(); }
    };
    return 1+1;
  })()`;

  async function open(url) {
    const loaded = new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('load timeout ' + url)), 20000);
      const prev = cdp.onEvent;
      cdp.onEvent = msg => {
        if (prev) prev(msg);
        if (msg.sessionId === sessionId && msg.method === 'Page.loadEventFired') { clearTimeout(t); resolve(); }
      };
    });
    await send('Page.navigate', { url });
    await loaded;
    await delay(200);
    const ping = await evalJson(boot);
    if (ping !== 2) throw new Error('startup eval returned ' + ping);
  }

  async function viewport(view) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: view.w, height: view.h, deviceScaleFactor: 1, mobile: view.mobile
    });
    await send('Emulation.setTouchEmulationEnabled', { enabled: view.mobile, maxTouchPoints: 5 });
    await delay(120);
  }

  async function audit(screen, view) {
    const report = await evalJson('(' + AUDIT + ')(' + JSON.stringify(screen) + ')');
    const tag = view.name + ' ' + screen;
    if (report.overflowX || report.overflowY) {
      problems.push(tag + ' overflow ' + report.scrollW + 'x' + report.scrollH + ' in ' + report.innerW + 'x' + report.innerH);
    }
    if (report.off.length) problems.push(tag + ' offscreen ' + report.off.join('; '));
    if (screen === 'battle') {
      if (!(report.canvasH > 250)) problems.push(tag + ' canvas ' + report.canvasH);
      if (report.touchOn !== view.mobile) problems.push(tag + ' touchpad ' + report.touchOn);
      const cap = report.caption;
      if (!cap || cap.font < 12 || cap.off || cap.overHud || cap.overFighters || cap.overTouch) {
        problems.push(tag + ' caption ' + JSON.stringify(cap));
      }
    }
    return report;
  }

  async function shot(name) {
    const png = await send('Page.captureScreenshot', { format: 'png' });
    const file = path.join(OUT, 'layout-' + name + '.png');
    writeFileSync(file, Buffer.from(png.data, 'base64'));
    console.log(file);
  }

  await open(PAGE);
  for (const view of VIEWS) { await viewport(view); await audit('title', view); }
  await viewport(VIEWS[0]);
  await evalJson(`document.querySelector('#arcade').click()`);
  await delay(150);
  for (const view of VIEWS) { await viewport(view); await audit('select', view); }
  await viewport(VIEWS[0]);
  await evalJson(`document.querySelector('#begin').click()`);
  const live = Date.now();
  let dueling = false;
  while (Date.now() - live < 20000) {
    dueling = await evalJson(`!!(window.__duel && window.__duel.state === 'live' && !document.querySelector('#battle').hidden)`);
    if (dueling) break;
    await delay(100);
  }
  if (!dueling) problems.push('battle did not go live');
  for (const view of VIEWS) {
    await viewport(view);
    await audit('battle', view);
    await shot(view.name);
  }
  await viewport(VIEWS[1]);
  const touch = await evalJson(`(async () => {
    const d = window.__duel;
    const x0 = d.players[0].x;
    const right = document.querySelector('[data-hold="right"]');
    right.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true }));
    await new Promise(r => setTimeout(r, 280));
    const dx = d.players[0].x - x0;
    right.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch' }));
    const punch = document.querySelector('[data-tap="punch"]');
    punch.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 8, pointerType: 'touch', isPrimary: true }));
    await new Promise(r => setTimeout(r, 140));
    const attack = d.players[0].attack && d.players[0].attack.type;
    punch.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 8, pointerType: 'touch' }));
    return { dx, attack, state: d.state };
  })()`);
  console.log('touch', JSON.stringify(touch));
  if (!(touch.dx > 20)) problems.push('touch walk dx ' + touch.dx);
  if (touch.attack !== 'punch') problems.push('touch punch ' + touch.attack);

  await open(FILE_PAGE);
  for (const view of [VIEWS[0], VIEWS[1]]) { await viewport(view); await audit('title', view); }
  await viewport(VIEWS[1]);
  await evalJson(`document.querySelector('#arcade').click()`);
  await delay(200);
  const fileAudio = await evalJson(`(window.__played || []).map(u => (u.split('/').pop() || '').split('?')[0])`);
  console.log('file audio', fileAudio);
  if (!fileAudio.some(name => name === 'menu.wav')) problems.push('file layout did not request menu.wav');
  if (fileAudio.some(name => /^(menu|opera|glasshouse)\\.mp3$/.test(name))) problems.push('file layout requested mp3 music');

  if (problems.length) {
    console.error('\nFAILED\n' + problems.join('\n'));
    shutdown(1);
  }
  console.log('\nPASSED layout');
  shutdown(0);
} catch (err) {
  console.error(err);
  console.error(problems.join('\n'));
  shutdown(1);
}
