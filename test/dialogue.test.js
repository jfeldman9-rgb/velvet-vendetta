'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { table, Director } = require('../dialogue.js');

const categories = ['intro', 'taunt', 'bigHit', 'block', 'special', 'meter', 'roundWin', 'roundLoss', 'matchWin', 'finisher'];

test('each fighter has at least 8 lines in every caption category', () => {
  for (const id of ['cory', 'bob']) {
    assert.deepEqual(Object.keys(table[id]).sort(), categories.slice().sort());
    for (const cat of categories) {
      const lines = table[id][cat];
      assert.ok(lines.length >= 8, id + ' ' + cat + ' ' + lines.length);
      const seen = new Set();
      for (const line of lines) {
        assert.equal(typeof line, 'string');
        assert.ok(line.length >= 8 && line.length <= 52, id + ' ' + cat + ' [' + line + '] ' + line.length);
        assert.equal(/k\.o/i.test(line), false, line);
        assert.equal(/[<>]/.test(line), false, line);
        assert.equal(seen.has(line), false, line);
        seen.add(line);
      }
    }
  }
});

test('picks do not repeat immediately', () => {
  const director = new Director(() => 0);
  for (const id of ['cory', 'bob']) {
    for (const cat of categories) {
      let previous = '';
      for (let i = 0; i < 24; i++) {
        const line = director.take(id, cat);
        assert.notEqual(line, previous);
        previous = line;
      }
    }
  }
});

test('the banks mention the house, the eggplant, and both finishers', () => {
  const blob = JSON.stringify(table);
  assert.match(blob, /Buck 75/);
  assert.match(blob, /Colombian/);
  assert.match(blob, /eggplant/i);
  assert.match(blob, /opera house/i);
  assert.match(blob, /Aubergine Ovation/);
  assert.match(blob, /Protocol Violet/);
  assert.equal(/k\.o/i.test(blob), false);
});
