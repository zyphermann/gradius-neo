import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const root = new URL('../public/assets/', import.meta.url);
const output = new URL('../public/assets/manifest.json', import.meta.url);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === 'manifest.json') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }

  return files;
}

function detectKind(bytes, name) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (bytes.subarray(0, 4).toString('ascii') === 'MThd') return 'midi';
  if (name === 'MANIFEST.MF') return 'manifest';
  if (name.startsWith('csv_')) return 'game-data';
  if (name.startsWith('img_')) return 'image-data';
  return 'binary';
}

const rootPath = root.pathname;
const files = await walk(rootPath);
const resources = [];

for (const path of files.sort()) {
  const bytes = await readFile(path);
  const info = await stat(path);
  const resourcePath = relative(rootPath, path).split(sep).join('/');
  resources.push({
    path: resourcePath,
    size: info.size,
    kind: detectKind(bytes, resourcePath),
  });
}

await writeFile(output, `${JSON.stringify({ resources }, null, 2)}\n`);
console.log(`Wrote ${resources.length} resources to public/assets/manifest.json`);
