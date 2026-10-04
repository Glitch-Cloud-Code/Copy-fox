import { readFile, readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const root = resolve('dist');
async function exists(path) { assert.ok((await stat(path)).isFile(), `Missing file: ${path}`); }
for (const file of await readdir('dist/js')) {
  const result = spawnSync(process.execPath, ['--check', `dist/js/${file}`], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}
const html = await readFile('dist/index.html', 'utf8');
for (const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) await exists(resolve(root, match[1]));
const css = await readFile('dist/styles.css', 'utf8');
for (const match of css.matchAll(/url\("([^"#]+)"\)/g)) await exists(resolve(root, match[1]));
const models = JSON.parse(await readFile('dist/models.json', 'utf8'));
const provenance = JSON.parse(await readFile('docs/assets/provenance.json', 'utf8'));
assert.ok(models.length >= 5);
assert.equal(new Set(models.map(model => model.path)).size, models.length);
for (const model of models) {
  const data = await readFile(resolve(root, model.path));
  assert.equal(data.subarray(0, 4).toString(), 'glTF');
  assert.equal(data.readUInt32LE(4), 2);
  assert.equal(data.readUInt32LE(8), data.length);
  assert.equal(createHash('sha256').update(data).digest('hex'), provenance.find(item => item.id === model.id).sha256);
  assert.ok(model.author && model.source && model.license && model.licenseUrl);
}
// Follow local module dependencies to detect incomplete vendoring.
const visited = new Set();
async function verifyImports(file) {
  if (visited.has(file)) return;
  visited.add(file);
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    if (match[1] === 'three') continue;
    if (!match[1].startsWith('.')) continue;
    await verifyImports(resolve(dirname(file), match[1]));
  }
}
await verifyImports(resolve(root, 'js/app.js'));
await verifyImports(resolve(root, 'vendor/three.module.js'));
console.log(`Static check passed: ${models.length} valid credited GLBs, complete imports, local assets, and JavaScript syntax.`);
