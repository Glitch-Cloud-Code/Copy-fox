import { mkdir, copyFile } from 'node:fs/promises';
const files = [
  ['build/three.module.js', 'three.module.js'],
  ['build/three.core.js', 'three.core.js'],
  ['examples/jsm/loaders/GLTFLoader.js', 'loaders/GLTFLoader.js'],
  ['examples/jsm/utils/BufferGeometryUtils.js', 'utils/BufferGeometryUtils.js'],
  ['examples/jsm/utils/SkeletonUtils.js', 'utils/SkeletonUtils.js'],
  ['LICENSE', 'LICENSE'],
];
for (const [source, target] of files) {
  const output = new URL(`../dist/vendor/${target}`, import.meta.url);
  await mkdir(new URL('.', output), { recursive: true });
  await copyFile(new URL(`../node_modules/three/${source}`, import.meta.url), output);
}
console.log('Vendored Three.js 0.186.1 and its license.');
