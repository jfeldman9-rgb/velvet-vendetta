/**
 * Headless Chrome pass: full arcade flow, specials, three-round outcomes,
 * finishers, rematch, menu, network, and frame pacing.
 *   node test/browser-smoke.mjs
 */
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const fileMode = process.argv.includes('--file');
const rootFlag = process.argv.indexOf('--root');
const ROOT = rootFlag >= 0 ? path.resolve(process.argv[rootFlag + 1]) : fileURLToPath(new URL('..', import.meta.url));
const PORT = 8765;
const CDP_PORT = fileMode ? 9335 : 9333;
const PAGE = fileMode
  ? pathToFileURL(path.join(ROOT, 'index.html')).href
  : `http://127.0.0.1:${PORT}/index.html`;

const server = fileMode ? null : spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe']
});
const chrome = spawn('google-chrome', [
  '--headless=new',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  '--autoplay-policy=no-user-gesture-required',
  '--allow-file-access-from-files',
  '--window-size=1280,720',
  '--force-device-scale-factor=2',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=/tmp/vv-chrome-${process.pid}`,
  'about:blank'
], { stdio: 'ignore' });

const net = [];
const consoleErrors = [];
let fail = '';

function shutdown(code) {
  chrome.kill('SIGKILL');
  if (server) server.kill('SIGKILL');
  process.exit(code);
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method) this.onEvent(msg);
    });
  }
  onEvent() {}
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

const HOOKS = `(() => {
  window.__played = [];
  window.__errors = [];
  window.__fights = [];
  window.__specials = [];
  window.__marks = [];
  window.addEventListener('blur', e => e.stopImmediatePropagation(), true);
  window.addEventListener('error', e => window.__errors.push(String(e.message)));
  window.addEventListener('unhandledrejection', e => window.__errors.push('rej ' + e.reason));
  const origPlay = HTMLAudioElement.prototype.play;
  HTMLAudioElement.prototype.play = function () {
    window.__played.push(String(this.src || this.currentSrc || ''));
    try {
      const p = origPlay.apply(this, arguments);
      if (p && typeof p.catch === 'function') p.catch(() => {});
      return p;
    } catch (err) { return Promise.resolve(); }
  };
  const Orig = window.VelvetDuel;
  const origEmit = Orig.prototype.emit;
  Orig.prototype.emit = function (type, data) {
    if (type === 'fight') window.__fights.push(this.elapsed);
    if (type === 'special') window.__specials.push(this.players[data.index].id);
    return origEmit.apply(this, arguments);
  };
  function Wrapped(...args) {
    const d = new Orig(...args);
    window.__duel = d;
    const origSet = d.setState.bind(d);
    d.setState = function (state) {
      window.__marks.push({ from: this.state, to: state, elapsed: this.elapsed, round: this.round, endKind: this.endKind, winner: this.winner, who: this.players[this.winner] && this.players[this.winner].id });
      return origSet(state);
    };
    return d;
  }
  Wrapped.prototype = Orig.prototype;
  window.VelvetDuel = Wrapped;
  window.waitFor = (label, fn, ms = 20000) => new Promise((resolve, reject) => {
    const t0 = performance.now();
    (function tick() {
      let v = null;
      try { v = fn(); } catch (err) { v = null; }
      if (v) return resolve(v);
      if (performance.now() - t0 > ms) {
        const d = window.__duel;
        return reject(new Error('timeout ' + label + ' state=' + (d && d.state) + ' round=' + (d && d.round) + ' dialog=' + document.querySelector('#dialog').open));
      }
      setTimeout(tick, 40);
    })();
  });
  window.tap = code => document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
  window.sampleFps = ms => new Promise(resolve => {
    const deltas = [];
    let last = performance.now();
    const t0 = last;
    function tick(t) {
      deltas.push(t - last); last = t;
      if (t - t0 < ms) requestAnimationFrame(tick);
      else {
        deltas.sort((a, b) => a - b);
        const sum = deltas.reduce((s, n) => s + n, 0);
        resolve({
          n: deltas.length,
          median: deltas[deltas.length >> 1],
          p95: deltas[Math.min(deltas.length - 1, Math.floor(deltas.length * 0.95))],
          mean: sum / deltas.length,
          over32: deltas.filter(n => n > 32).length
        });
      }
    }
    requestAnimationFrame(tick);
  });
  return 'hooks';
})()`;

const FILE_PROBE = `(() => {
  const names = () => (window.__played || []).map(u => (u.split('/').pop() || '').split('?')[0]);
  return (async () => {
    document.body.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    document.querySelector('#arcade').click();
    await new Promise(r => setTimeout(r, 600));
    return {
      title: document.title,
      protocol: location.protocol,
      dialogue: typeof VelvetDialogue,
      played: names(),
      errors: window.__errors || []
    };
  })();
})()`;

const MATCH = `(() => {
  const click = sel => document.querySelector(sel).click();
  const names = () => (window.__played || []).map(u => u.split('/').pop().split('?')[0]);
  const has = needle => names().some(n => n === needle || n.startsWith(needle));
  return (async () => {
    click('#arcade');
    await window.waitFor('select', () => document.querySelector('#select') && !document.querySelector('#select').hidden);
    click('#begin');
    await window.waitFor('live1', () => window.__duel && window.__duel.state === 'live');
    const liveAt = window.__marks.filter(m => m.to === 'live').map(m => m.elapsed);
    const canvas = document.querySelector('#canvas');
    const dpr = { css: canvas.clientWidth, buf: canvas.width, cap: Math.min(devicePixelRatio || 1, 1.5), ratio: devicePixelRatio };
    window.tap('KeyL');
    await new Promise(r => setTimeout(r, 450));
    const d = window.__duel;
    d.players[1].meter = 80;
    d.players[1].attack = null;
    d.players[1].stun = 0;
    d.stop = 0;
    d.chooseAI = () => ({ special: true });
    await new Promise(r => setTimeout(r, 600));
    const specials = window.__specials.slice();
    d.chooseAI = () => ({});
    d.players[0].attack = null;
    d.players[1].attack = null;
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD', bubbles: true, cancelable: true }));
    const clock = d.time;
    const fps = await window.sampleFps(2000);
    const advanced = clock - d.time;
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD', bubbles: true, cancelable: true }));
    const shot = document.querySelector('#canvas').toDataURL('image/jpeg', 0.72);
    d.chooseAI = () => ({});
    d.players.forEach(p => { p.attack = null; p.stun = 0; });
    d.stop = 0;
    d.players[0].hp = 0; d.players[1].hp = 80;
    await window.waitFor('r2', () => d.round === 2 && d.state === 'live', 15000);
    d.players.forEach(p => { p.attack = null; p.stun = 0; });
    d.players[0].hp = 100; d.players[1].hp = 0;
    await window.waitFor('r3', () => d.round === 3 && d.state === 'live', 15000);
    d.players.forEach(p => { p.attack = null; p.stun = 0; });
    d.players[0].hp = 40; d.players[1].hp = 0;
    await window.waitFor('finish-cory', () => d.state === 'finish', 15000);
    window.tap('KeyF');
    let aubergine = '';
    await window.waitFor('finale-cory', () => {
      const text = document.querySelector('#callout b')?.textContent || '';
      if (text.includes('Aubergine')) aubergine = text;
      return d.state === 'results';
    }, 12000);
    await new Promise(r => setTimeout(r, 2200));
    const afterCory = names();
    click('#rematch');
    await window.waitFor('rematch-live', () => window.__duel !== d && window.__duel.state === 'live', 15000);
    const rematch = window.__duel;
    rematch.chooseAI = () => ({});
    rematch.players.forEach(p => { p.attack = null; p.stun = 0; });
    rematch.stop = 0;
    rematch.players[0].hp = 60; rematch.players[1].hp = 0;
    await window.waitFor('ord-r2', () => rematch.round === 2 && rematch.state === 'live', 15000);
    rematch.players.forEach(p => { p.attack = null; p.stun = 0; });
    rematch.stop = 0;
    rematch.players[0].hp = 40; rematch.players[1].hp = 0;
    await window.waitFor('ord-finish', () => rematch.state === 'finish', 15000);
    await window.waitFor('ord-results', () => rematch.state === 'results', 12000);
    const ordinary = !document.querySelector('.result-img') && rematch.viaFinale === false;
    click('#done');
    await window.waitFor('ord-home', () => !document.querySelector('#home').hidden && document.querySelector('#battle').hidden);
    click('[data-arena="glasshouse"]');
    click('#arcade');
    await window.waitFor('select2', () => !document.querySelector('#select').hidden);
    click('[data-pick="bob"]');
    click('#begin');
    await window.waitFor('bob-live', () => window.__duel.players[0].id === 'bob' && window.__duel.state === 'live', 15000);
    const b = window.__duel;
    b.chooseAI = () => ({});
    b.players.forEach(p => { p.attack = null; p.stun = 0; });
    b.players[0].hp = 70; b.players[1].hp = 30; b.time = 0.02;
    await window.waitFor('bob-r2', () => b.round === 2 && b.state === 'live', 15000);
    b.players.forEach(p => { p.attack = null; p.stun = 0; });
    b.players[0].hp = 50; b.players[1].hp = 0;
    await window.waitFor('finish-bob', () => b.state === 'finish', 15000);
    window.tap('KeyF');
    let violet = '';
    await window.waitFor('finale-bob', () => {
      const text = document.querySelector('#callout b')?.textContent || '';
      if (text.includes('Protocol')) violet = text;
      return b.state === 'results';
    }, 12000);
    await new Promise(r => setTimeout(r, 2200));
    click('#done');
    await window.waitFor('menu', () => !document.querySelector('#home').hidden && document.querySelector('#battle').hidden);
    return {
      liveAt, dpr, specials, fps, advanced, aubergine, violet, ordinary,
      marks: window.__marks,
      fights: window.__fights,
      played: names(),
      afterCory,
      shot,
      errors: window.__errors,
      hidden: document.hidden,
      home: !document.querySelector('#home').hidden
    };
  })();
})()`;

try {
  await delay(300);
  const ver = await waitJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject); });
  const cdp = new CDP(ws);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params) => cdp.send(method, params, sessionId);
  cdp.onEvent = msg => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === 'Network.responseReceived') {
      const { status, url } = msg.params.response;
      net.push({ status, url });
    } else if (msg.method === 'Network.loadingFailed' && msg.params.errorText && !/ERR_ABORTED/.test(msg.params.errorText)) {
      net.push({ status: 0, url: msg.params.errorText + ' ' + (msg.params.requestId || '') });
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const ex = msg.params.exceptionDetails;
      consoleErrors.push(ex.exception?.description || ex.text || 'exception');
    } else if (msg.method === 'Runtime.consoleAPICalled' && (msg.params.type === 'error' || msg.params.type === 'assert')) {
      consoleErrors.push(msg.params.args.map(a => a.value || a.description || a.type).join(' '));
    } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      consoleErrors.push(msg.params.entry.text + ' ' + (msg.params.entry.url || ''));
    }
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Log.enable');
  const loaded = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('load timeout')), 15000);
    const prev = cdp.onEvent;
    cdp.onEvent = msg => {
      prev(msg);
      if (msg.sessionId === sessionId && msg.method === 'Page.loadEventFired') { clearTimeout(t); resolve(); }
    };
  });
  await send('Page.navigate', { url: PAGE });
  await loaded;
  await delay(250);
  const ping = await send('Runtime.evaluate', { expression: '1+1', returnByValue: true });
  if (ping.exceptionDetails) throw new Error('startup eval failed: ' + (ping.exceptionDetails.exception?.description || ping.exceptionDetails.text || 'Uncaught'));
  if (!ping.result || ping.result.value !== 2) throw new Error('startup eval returned ' + JSON.stringify(ping.result));
  const hooked = await send('Runtime.evaluate', { expression: HOOKS, returnByValue: true });
  if (hooked.exceptionDetails) {
    const ex = hooked.exceptionDetails;
    throw new Error('hook injection failed: ' + (ex.exception?.description || ex.text || JSON.stringify(ex)));
  }
  if (fileMode) {
    const ran = await send('Runtime.evaluate', { expression: FILE_PROBE, awaitPromise: true, returnByValue: true });
    if (ran.exceptionDetails) {
      const ex = ran.exceptionDetails;
      throw new Error(ex.exception?.description || ex.text || JSON.stringify(ex));
    }
    const report = ran.result.value;
    const played = report.played || [];
    const problems = [];
    if (report.protocol !== 'file:') problems.push('protocol ' + report.protocol);
    if (!String(report.title).includes('Velvet Vendetta')) problems.push('title ' + report.title);
    if (report.dialogue !== 'object') problems.push('dialogue missing');
    if (!played.some(name => name === 'menu.wav')) problems.push('menu.wav was not requested: ' + played.join(','));
    if (played.some(name => /^(menu|opera|glasshouse)\.mp3$/.test(name))) problems.push('file build requested mp3 music');
    if (report.errors.length) problems.push('page errors ' + report.errors.join(' | '));
    if (consoleErrors.length) problems.push('console ' + consoleErrors.join(' | '));
    console.log(JSON.stringify({ protocol: report.protocol, title: report.title, played }, null, 2));
    if (problems.length) {
      console.error('\nFAILED\n' + problems.join('\n'));
      shutdown(1);
    }
    console.log('\nPASSED file');
    shutdown(0);
  }
  const ran = await send('Runtime.evaluate', { expression: MATCH, awaitPromise: true, returnByValue: true });
  if (ran.exceptionDetails) {
    const ex = ran.exceptionDetails;
    throw new Error(ex.exception?.description || ex.text || JSON.stringify(ex));
  }
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('/tmp/vv-menu.png', Buffer.from(shot.data, 'base64'));
  const report = ran.result.value;
  if (report.shot) {
    writeFileSync('/tmp/vv-live.jpg', Buffer.from(report.shot.split(',')[1], 'base64'));
    delete report.shot;
  }
  const bad = net.filter(n => n.status >= 400 || n.status === 0);
  const urls = net.map(n => n.url);
  const wanted = ['menu.mp3', 'opera.mp3', 'glasshouse.mp3', 'round1.mp3', 'fight.mp3', 'ko-bob.mp3', 'ko-cory.mp3', 'perfect.mp3', 'time.mp3', 'finale-cory.mp3', 'finale-bob.mp3'];
  const missingNet = wanted.filter(name => !urls.some(u => u.includes('/' + name)));
  const wavMusic = urls.filter(u => /\/(menu|opera|glasshouse)\.wav(\?|$)/.test(u));
  const liveOk = report.liveAt.length && report.liveAt.every(t => t >= 2.5 && t <= 3.05);
  const fpsOk = report.fps.median >= 14 && report.fps.median <= 18 && report.fps.over32 <= 2;
  const dprOk = Math.abs(report.dpr.buf - Math.round(report.dpr.css * 1.5)) <= 1;
  const kinds = report.marks.filter(m => m.to === 'roundEnd').map(m => m.endKind + ':' + m.who);
  const checks = {
    liveOk,
    liveAt: report.liveAt,
    specials: report.specials,
    bothSpecials: report.specials.includes('cory') && report.specials.includes('bob'),
    rounds: [...new Set(report.marks.map(m => m.round))].sort(),
    kinds,
    aubergine: report.aubergine,
    violet: report.violet,
    fps: report.fps,
    fpsOk,
    advanced: report.advanced,
    dpr: report.dpr,
    dprOk,
    playedKo: ['ko-bob.mp3', 'ko-cory.mp3', 'perfect.mp3', 'time.mp3', 'line-cory-win.mp3', 'line-bob-win.mp3', 'line-cory-special.mp3', 'line-bob-special.mp3'].filter(n => !report.played.includes(n)),
    missingNet,
    wavMusic,
    bad,
    consoleErrors,
    pageErrors: report.errors,
    home: report.home,
    fights: report.fights.length
  };
  console.log(JSON.stringify(checks, null, 2));
  const problems = [];
  if (!liveOk) problems.push('intro did not go live between 2.5 and 3s');
  if (!checks.bothSpecials) problems.push('missing a side special: ' + report.specials.join(','));
  if (!kinds.includes('ko:bob') || !kinds.includes('ko:cory')) problems.push('missing winner KO kinds ' + kinds.join(','));
  if (!kinds.includes('perfect:cory')) problems.push('missing perfect');
  if (!kinds.includes('time:bob')) problems.push('missing time-out');
  if (!report.aubergine.includes('Aubergine')) problems.push('missing Aubergine Ovation');
  if (!report.violet.includes('Protocol')) problems.push('missing Protocol Violet');
  if (!report.ordinary) problems.push('ordinary victory did not skip the finisher');
  if (/K\.O\./i.test(JSON.stringify(report.marks) + (report.aubergine || '') + (report.violet || ''))) problems.push('showed K.O.');
  if (checks.playedKo.length) problems.push('audio not played: ' + checks.playedKo.join(','));
  if (missingNet.length) problems.push('not requested: ' + missingNet.join(','));
  if (wavMusic.length) problems.push('web build requested wav music');
  if (bad.length) problems.push('http failures ' + JSON.stringify(bad));
  if (consoleErrors.length) problems.push('console ' + consoleErrors.join(' | '));
  if (report.errors.length) problems.push('page errors ' + report.errors.join(' | '));
  if (!report.home) problems.push('did not return home');
  if (!(report.advanced > 1.4 && report.advanced < 2.6)) problems.push('clock did not advance ' + report.advanced);
  if (!fpsOk) problems.push('fps unstable median ' + report.fps.median);
  if (!dprOk) problems.push('dpr cap missed ' + JSON.stringify(report.dpr));
  if (problems.length) {
    fail = problems.join('\n');
    console.error('\nFAILED\n' + fail);
    shutdown(1);
  }
  console.log('\nPASSED');
  shutdown(0);
} catch (err) {
  console.error(err);
  console.log('NET', JSON.stringify(net.filter(n => n.status >= 400), null, 2));
  console.log('CONSOLE', consoleErrors);
  shutdown(1);
}
