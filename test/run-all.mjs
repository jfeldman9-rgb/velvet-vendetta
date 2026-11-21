import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const node = process.execPath;

function run(args) {
  const result = spawnSync(node, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status == null ? 1 : result.status);
}

const units = readdirSync(path.join(root, 'test')).filter(name => name.endsWith('.test.js')).sort();
run(['--test', ...units.map(name => path.join('test', name))]);
run(['test/browser-smoke.mjs']);
run(['test/browser-smoke.mjs', '--file']);
run(['test/layout-smoke.mjs']);
console.log('\nALL PASSED');
