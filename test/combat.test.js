'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Duel = require('../combat.js');

const dt = 1 / 60;

function fresh() {
  const d = new Duel('cory', 'arcade', () => 0);
  const marks = [];
  const orig = d.setState.bind(d);
  d.setState = function (state) {
    marks.push({ from: this.state, to: state, elapsed: this.elapsed, endKind: this.endKind, winner: this.winner });
    return orig(state);
  };
  let fightAt = null;
  const origEmit = d.emit.bind(d);
  d.emit = function (type, data) {
    if (type === 'fight' && fightAt == null) fightAt = this.elapsed;
    return origEmit(type, data);
  };
  return { d, marks, fightAt: () => fightAt };
}

function toLive(d) {
  let n = 0;
  while (d.state !== 'live' && n++ < 1000) d.step(dt, {});
}

test('fight cue stays at 1.5s and combat goes live within 2.5–3s', () => {
  const { d, marks, fightAt } = fresh();
  toLive(d);
  const live = marks.find(m => m.to === 'live');
  assert.ok(fightAt() > 1.5 && fightAt() < 1.7, 'fight at ' + fightAt());
  assert.ok(live.elapsed >= 2.5 && live.elapsed <= 3, 'live at ' + live.elapsed);
  assert.ok(fightAt() < live.elapsed);
  assert.equal(d.state, 'live');
});

test('a later round uses the same short intro', () => {
  const { d, marks, fightAt } = fresh();
  toLive(d);
  d.players[1].hp = 0;
  d.players[0].hp = 40;
  d.chooseAI = () => ({});
  d.step(dt, {});
  assert.equal(d.endKind, 'ko');
  let n = 0;
  while (d.state === 'roundEnd' && n++ < 1000) d.step(dt, {});
  assert.equal(d.round, 2);
  assert.equal(d.state, 'intro');
  const before = marks.length;
  toLive(d);
  const live = marks.slice(before).find(m => m.to === 'live');
  assert.ok(live.elapsed >= 2.5 && live.elapsed <= 3, 'round 2 live at ' + live.elapsed);
  assert.ok(fightAt() > 1.5);
});

function holdAfter(setup) {
  const { d } = fresh();
  toLive(d);
  d.chooseAI = () => ({});
  let at = null;
  const orig = d.setState.bind(d);
  d.setState = function (state) {
    if (this.state === 'roundEnd') at = this.elapsed;
    return orig(state);
  };
  setup(d);
  d.step(dt, {});
  assert.equal(d.state, 'roundEnd');
  const endKind = d.endKind;
  const winner = d.winner;
  let n = 0;
  while (d.state === 'roundEnd' && n++ < 1000) d.step(dt, {});
  return { d, at, endKind, winner };
}

test('knockout, perfect, and time each set endKind and the right hold', () => {
  const ko = holdAfter(d => { d.players[1].hp = 0; d.players[0].hp = 40; });
  assert.equal(ko.endKind, 'ko');
  assert.ok(ko.at >= 3.5 && ko.at <= 3.7, 'ko hold ' + ko.at);

  const perfect = holdAfter(d => { d.players[1].hp = 0; d.players[0].hp = 100; });
  assert.equal(perfect.endKind, 'perfect');
  assert.equal(perfect.winner, 0);
  assert.ok(perfect.at >= 1.7 && perfect.at <= 1.9, 'perfect hold ' + perfect.at);

  const time = holdAfter(d => { d.players[0].hp = 55; d.players[1].hp = 20; d.time = 0; });
  assert.equal(time.endKind, 'time');
  assert.equal(time.winner, 0);
  assert.ok(time.at >= 1.7 && time.at <= 1.9, 'time hold ' + time.at);
});

test('both fighters can spend meter on a special', () => {
  const { d } = fresh();
  toLive(d);
  d.step(dt, { special: true });
  assert.equal(d.players[0].meter, 2);
  assert.equal(d.events.some(e => e.type === 'special' && e.index === 0), true);
  d.events.length = 0;
  d.players[1].meter = 40;
  d.players[1].attack = null;
  d.players[1].stun = 0;
  d.chooseAI = () => ({ special: true });
  d.step(dt, {});
  assert.equal(d.players[1].meter, 0);
  assert.equal(d.events.some(e => e.type === 'special' && e.index === 1), true);
});

test('app.js does not shadow banter() and the frame loop survives a throw', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  assert.match(src, /this\.banterEl\s*=\s*new Audio/);
  assert.equal(/this\.banter\s*=\s*new Audio/.test(src), false);
  assert.match(src, /banter\(id\)/);
  assert.match(src, /this\.banter\(id\)/);
  assert.match(src, /location\.protocol==='file:'\?'wav':'mp3'/);
  assert.match(src, /p\.catch\(\(\)=>\{\}\)/);
  const frame = src.slice(src.indexOf('function frame(now)'));
  const schedule = frame.indexOf('requestAnimationFrame(frame)');
  const trap = frame.indexOf('try{');
  assert.ok(schedule >= 0 && trap > schedule, 'rAF is armed before the frame body');
  assert.match(frame, /catch\(err\)/);
  const combat = fs.readFileSync(path.join(__dirname, '..', 'combat.js'), 'utf8');
  assert.match(combat, /elapsed>=2\.90/);
  assert.equal(/elapsed>=6\.20/.test(combat), false);
  const render = fs.readFileSync(path.join(__dirname, '..', 'render.js'), 'utf8');
  assert.match(render, /Math\.min\(devicePixelRatio\|\|1,\s*1\.5\)/);
});

function ready(mode = 'arcade') {
  const d = new Duel('cory', mode, () => 0);
  toLive(d);
  d.chooseAI = () => ({});
  return d;
}

function skip(d, state) {
  let n = 0;
  while (d.state === state && n++ < 800) d.step(dt, {});
  return n;
}

function koSide(d, winner) {
  d.stop = 0;
  d.players[winner].hp = 70;
  d.players[1 - winner].hp = 0;
  d.players[0].attack = null;
  d.players[1].attack = null;
  d.step(dt, {});
}

test('best of three reaches the finisher and a split goes to round three', () => {
  const d = ready();
  koSide(d, 0);
  assert.equal(d.state, 'roundEnd');
  assert.equal(d.players[0].wins, 1);
  skip(d, 'roundEnd');
  assert.equal(d.round, 2);
  assert.equal(d.state, 'intro');
  toLive(d);
  d.chooseAI = () => ({});
  koSide(d, 1);
  skip(d, 'roundEnd');
  assert.equal(d.round, 3);
  assert.equal(d.players[0].wins, 1);
  assert.equal(d.players[1].wins, 1);
  assert.equal(d.state, 'intro');
  toLive(d);
  d.chooseAI = () => ({});
  koSide(d, 0);
  skip(d, 'roundEnd');
  assert.equal(d.state, 'finish');
  assert.equal(d.players[0].wins, 2);
});

test('finisher input, ordinary expiry, and the cpu auto finisher', () => {
  const pressed = ready();
  pressed.players[0].wins = 1;
  koSide(pressed, 0);
  skip(pressed, 'roundEnd');
  assert.equal(pressed.state, 'finish');
  pressed.step(dt, { finish: true });
  assert.equal(pressed.state, 'finale');
  assert.equal(pressed.viaFinale, true);
  const toResults = skip(pressed, 'finale');
  assert.equal(pressed.state, 'results');
  assert.ok(toResults > 300 && toResults < 360, 'finale length ' + toResults);

  const expired = ready();
  expired.players[0].wins = 1;
  koSide(expired, 0);
  skip(expired, 'roundEnd');
  const held = skip(expired, 'finish');
  assert.equal(expired.state, 'results');
  assert.equal(expired.viaFinale, false);
  assert.ok(held > 385 && held < 400, 'finish hold ' + held);

  const cpu = ready();
  cpu.players[1].wins = 1;
  koSide(cpu, 1);
  skip(cpu, 'roundEnd');
  assert.equal(cpu.state, 'finish');
  assert.equal(cpu.winner, 1);
  const auto = skip(cpu, 'finish');
  assert.equal(cpu.state, 'finale');
  assert.equal(cpu.viaFinale, true);
  assert.ok(auto > 118 && auto < 126, 'cpu finale steps ' + auto);
});

test('a tied clock is sudden death and the next hit ends the round', () => {
  const d = ready();
  d.players[0].hp = 25;
  d.players[1].hp = 25;
  d.time = 0;
  d.step(dt, {});
  assert.equal(d.sudden, true);
  assert.equal(d.players[0].hp, 1);
  assert.equal(d.players[1].hp, 1);
  assert.equal(d.events.some(e => e.type === 'sudden'), true);
  assert.equal(d.state, 'live');
  d.stop = 0;
  const a = d.players[0];
  const b = d.players[1];
  a.x = 400; b.x = 530; a.y = b.y = 0; a.face = 1; b.face = -1;
  a.hp = b.hp = 1; a.attack = b.attack = null; a.stun = b.stun = 0;
  const punch = Duel.moves.punch;
  a.attack = { type: 'punch', move: punch, t: punch.startup + 0.02, landed: false, face: 1 };
  d.step(dt, {});
  let n = 0;
  while (d.state === 'live' && n++ < 20) d.step(dt, {});
  assert.equal(d.state, 'roundEnd');
  assert.equal(d.winner, 0);
});

test('walls, separation, crouch, combo, and a dry special', () => {
  const d = ready();
  d.players[0].x = 140;
  for (let i = 0; i < 50; i++) d.step(dt, { left: true });
  assert.equal(d.players[0].x, 95);
  d.players[0].x = 1100;
  for (let i = 0; i < 50; i++) d.step(dt, { right: true });
  assert.equal(d.players[0].x, 1185);

  d.players[0].x = 500;
  d.players[1].x = 530;
  d.players[0].y = d.players[1].y = 0;
  d.step(dt, {});
  assert.ok(Math.abs(d.players[1].x - d.players[0].x) >= 66.5);

  const a = d.players[0];
  const b = d.players[1];
  a.x = 400; b.x = 530; a.y = b.y = 0; a.hp = b.hp = 100;
  a.face = 1; b.face = -1; a.stun = b.stun = 0; a.attack = b.attack = null; d.stop = 0;
  d.chooseAI = () => ({ crouch: true });
  const punch = Duel.moves.punch;
  a.attack = { type: 'punch', move: punch, t: punch.startup + 0.02, landed: false, face: 1 };
  d.step(dt, {});
  assert.equal(b.hp, 100, 'crouch ducks a standing jab');
  assert.equal(b.crouch, true);

  d.chooseAI = () => ({});
  a.attack = null; b.crouch = false; a.combo = 0; a.chain = 0; d.stop = 0;
  a.attack = { type: 'punch', move: punch, t: punch.startup + 0.02, landed: false, face: 1 };
  d.step(dt, {});
  assert.equal(a.combo, 1);
  let n = 0;
  while (a.attack && n++ < 40) d.step(dt, {});
  d.step(dt, { punch: true });
  n = 0;
  while (a.combo < 2 && n++ < 40) d.step(dt, {});
  assert.equal(a.combo, 2);
  n = 0;
  while (a.combo !== 0 && n++ < 90) d.step(dt, {});
  assert.equal(a.combo, 0);

  d.players[0].meter = 39;
  d.players[0].attack = null;
  d.players[0].stun = 0;
  d.players[0].hintCooldown = 0;
  d.stop = 0;
  d.events.length = 0;
  d.step(dt, { special: true });
  assert.equal(d.players[0].meter, 39);
  assert.equal(d.players[0].attack, null);
  assert.equal(d.events.some(e => e.type === 'lowMeter'), true);
});

test('attack buffer is about 0.2s and guard has an 80ms coyote window', () => {
  const buffered = ready();
  buffered.step(dt, { punch: true });
  assert.equal(buffered.players[0].attack.type, 'punch');
  let n = 0;
  while (buffered.players[0].attack && buffered.players[0].attack.t < 0.16 && n++ < 40) buffered.step(dt, {});
  buffered.step(dt, { kick: true });
  n = 0;
  while (buffered.players[0].attack && buffered.players[0].attack.type === 'punch' && n++ < 40) buffered.step(dt, {});
  assert.equal(buffered.players[0].attack && buffered.players[0].attack.type, 'kick');

  const dropped = ready();
  dropped.step(dt, { punch: true });
  dropped.step(dt, { kick: true });
  for (let i = 0; i < 16; i++) dropped.step(dt, {});
  assert.equal(dropped.players[0].buffer, null);
  while (dropped.players[0].attack) dropped.step(dt, {});
  assert.equal(dropped.players[0].attack, null);

  const guard = ready();
  const a = guard.players[0];
  const b = guard.players[1];
  a.x = 400; b.x = 530; a.y = b.y = 0; a.face = 1; b.face = -1;
  guard.step(dt, { guard: true });
  assert.equal(a.guard, true);
  guard.step(dt, {});
  guard.step(dt, {});
  const punch = Duel.moves.punch;
  b.attack = { type: 'punch', move: punch, t: punch.startup + 0.02, landed: false, face: -1 };
  guard.step(dt, {});
  assert.equal(a.hp, 100);
  assert.equal(guard.events.some(e => e.type === 'block'), true);

  const late = ready();
  const p = late.players[0];
  const q = late.players[1];
  p.x = 400; q.x = 530; p.y = q.y = 0; p.face = 1; q.face = -1;
  late.step(dt, { guard: true });
  for (let i = 0; i < 6; i++) late.step(dt, {});
  assert.equal(p.guard, false);
  q.attack = { type: 'punch', move: punch, t: punch.startup + 0.02, landed: false, face: -1 };
  late.stop = 0;
  late.step(dt, {});
  assert.ok(p.hp < 100);
});

test('hit-stop grows with damage and a knockout holds the final blow', () => {
  const d = ready();
  const a = d.players[0];
  const b = d.players[1];
  a.x = 400; b.x = 530; a.y = b.y = 0; a.face = 1; b.face = -1; a.hp = b.hp = 100;
  const punch = Duel.moves.punch;
  const kick = Duel.moves.kick;
  a.attack = { type: 'punch', move: punch, t: punch.startup + 0.02, landed: false, face: 1 };
  d.step(dt, {});
  const punchStop = d.stop;
  d.stop = 0; a.attack = null; a.combo = 0; a.chain = 0; b.hp = 100; b.stun = 0; b.x = 530;
  a.attack = { type: 'kick', move: kick, t: kick.startup + 0.02, landed: false, face: 1 };
  d.step(dt, {});
  assert.ok(d.stop > punchStop, 'kick stop ' + d.stop + ' punch ' + punchStop);
  d.stop = 0; a.attack = null; b.stun = 0; b.hp = punch.damage; b.x = 530;
  a.attack = { type: 'punch', move: punch, t: punch.startup + 0.02, landed: false, face: 1 };
  d.step(dt, {});
  assert.equal(b.hp, 0);
  assert.equal(d.blow, 0.4);
  assert.ok(d.stop >= 0.1);
  assert.equal(d.events.some(e => e.type === 'hit' && e.ko && e.damage === punch.damage), true);
});

test('training dummy resets and rehearse opens the finisher', () => {
  const d = new Duel('cory', 'training', () => 0);
  toLive(d);
  d.players[1].hp = 0;
  let n = 0;
  while (d.players[1].hp === 0 && n++ < 80) d.step(dt, {});
  assert.equal(d.players[1].hp, 100);
  assert.equal(d.events.some(e => e.type === 'dummyReset'), true);
  d.rehearse();
  assert.equal(d.state, 'finale');
  assert.equal(d.viaFinale, true);
  assert.equal(d.winner, 0);
});
