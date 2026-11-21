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
