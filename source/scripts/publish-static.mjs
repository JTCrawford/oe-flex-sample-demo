import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '../dist');
const targets = [
  path.resolve(here, '../deploy-out/app'),
  path.resolve(here, '../../app'),
];

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/index.html is missing. Run vite build first.');
  process.exit(1);
}

for (const target of targets) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(dist, target, { recursive: true });
  console.log(`published ${path.relative(path.resolve(here, '../..'), target)}`);
}
