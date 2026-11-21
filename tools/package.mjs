import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.resolve(root, '..', 'dist');
mkdirSync(dist, { recursive: true });
const zipPath = path.join(dist, 'velvet-vendetta.zip');
rmSync(zipPath, { force: true });

const include = [
  'index.html', 'app.js', 'combat.js', 'render.js', 'dialogue.js', 'style.css',
  'START-HERE.txt', 'Velvet-Vendetta-100-Goals.md', 'ART-PROVENANCE.md', 'assets'
];

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (result.status !== 0) {
    console.error(cmd + ' failed');
    process.exit(result.status || 1);
  }
}

run('zip', ['-r', '-1', '-X', zipPath, ...include, '-x', 'assets/audio/*.md', '*/.DS_Store'], { cwd: root });
run('unzip', ['-t', zipPath]);

const extract = mkdtempSync(path.join(tmpdir(), 'vv-pack-'));
try {
  run('unzip', ['-q', zipPath, '-d', extract]);
  if (!statSync(path.join(extract, 'index.html')).size) throw new Error('extracted index.html is empty');
  run(process.execPath, ['--test', path.join(root, 'test', 'assets.test.js')], {
    cwd: root,
    env: { ...process.env, VV_ROOT: extract }
  });
  run(process.execPath, [path.join(root, 'test', 'browser-smoke.mjs'), '--file', '--root', extract], { cwd: root });
} finally {
  rmSync(extract, { recursive: true, force: true });
}

const bytes = statSync(zipPath).size;
const mb = bytes / 1000000;
if (bytes < 100000000 || bytes > 500000000) {
  console.error('SIZE ' + bytes + ' B / ' + mb.toFixed(3) + ' MB is outside 100-500 MB');
  process.exit(1);
}
console.log('OK ' + bytes + ' B / ' + mb.toFixed(3) + ' MB');
