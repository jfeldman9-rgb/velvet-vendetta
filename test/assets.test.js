'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = process.env.VV_ROOT || path.join(__dirname, '..');

function read(name) {
  return fs.readFileSync(path.join(root, name), 'utf8');
}

function exists(file) {
  try { return fs.statSync(file).size > 0; } catch (_) { return false; }
}

function listRequired(dir) {
  const load = name => fs.readFileSync(path.join(dir, name), 'utf8');
  const sources = ['index.html', 'style.css', 'app.js', 'combat.js', 'render.js', 'dialogue.js'].map(load);
  const needed = new Set();
  for (const src of sources) {
    const clean = src.replace(/data:[a-z0-9/+;=,]+/gi, '');
    for (const match of clean.matchAll(/assets\/[A-Za-z0-9_./-]+\.(?:webp|svg|mp3|wav|png|jpg)/g)) needed.add(match[0]);
  }
  const poses = ['idle', 'walk', 'jump', 'punch', 'kick', 'special', 'guard', 'hurt', 'win', 'finale'];
  for (const id of ['cory', 'bob']) {
    for (const pose of poses) needed.add('assets/' + id + '-' + pose + '.webp');
    needed.add('assets/' + id + '-face.webp');
  }
  for (const name of ['aubergine', 'hero', 'opera', 'glasshouse']) needed.add('assets/' + name + '.webp');
  for (const name of ['crest', 'velvet', 'vendetta']) needed.add('assets/' + name + '.svg');
  const clips = [
    'menu-select', 'jump', 'whoosh', 'block', 'punch', 'kick', 'special-charge', 'special-cory', 'special-bob',
    'knockout', 'finale-hit-cory', 'finale-hit-bob', 'intro-cory', 'intro-bob', 'round1', 'round2', 'round3',
    'fight', 'time', 'perfect', 'ko-bob', 'ko-cory', 'ko', 'finish', 'finale-cory', 'finale-bob',
    'cory-wins', 'bob-wins', 'line-cory-special', 'line-bob-special', 'line-cory-win', 'line-bob-win'
  ];
  for (const id of clips) needed.add('assets/audio/' + id + '.mp3');
  for (const id of ['menu', 'opera', 'glasshouse']) {
    needed.add('assets/audio/' + id + '.mp3');
    needed.add('assets/audio/' + id + '.wav');
  }
  return [...needed];
}

function absent(dir, fileExists) {
  return listRequired(dir).filter(rel => !fileExists(path.join(dir, rel)));
}

test('every local asset reference resolves', () => {
  const gone = absent(root, exists);
  assert.deepEqual(gone, [], gone.join(', '));
  assert.ok(exists(path.join(root, 'dialogue.js')));
});

test('a missing asset fails the checker', () => {
  const gone = absent(root, file => exists(file) && !file.endsWith(path.join('assets', 'hero.webp')));
  assert.ok(gone.includes('assets/hero.webp'));
});

test('no remote urls and no K.O. in captions or transcripts', () => {
  const files = ['index.html', 'style.css', 'app.js', 'combat.js', 'render.js', 'dialogue.js'];
  const combined = files.map(read).join('\n').replace(/data:[a-z0-9/+;=,]+/gi, '');
  const stripped = combined.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '');
  assert.equal(/https?:\/\//.test(stripped), false);
  assert.equal(/@import\s+url\(\s*['"]?http/i.test(combined), false);
  assert.equal(/k\.o/i.test(read('dialogue.js') + '\n' + read('app.js') + '\n' + read('index.html')), false);
  const notesPath = path.join(root, 'assets', 'audio', 'ELEVENLABS-NOTES.md');
  if (fs.existsSync(notesPath)) {
    const notes = fs.readFileSync(notesPath, 'utf8');
    const quotes = [...notes.matchAll(/— "([^"]+)"/g)].map(m => m[1]);
    assert.ok(quotes.length >= 8);
    for (const quote of quotes) assert.equal(/k\.o/i.test(quote), false, quote);
  }
});
