// How imports are matched to files: tsconfig paths pick the most specific pattern, like TypeScript,
// and a stylesheet import finds .sass and .less files as well as .css and .scss.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lib, cleanup } from './helpers.mjs';

const { createResolver } = await lib('resolve.mjs');

function resolver(files, tsconfig) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'floorplan-resolve-'));
  fs.writeFileSync(path.join(root, 'tsconfig.json'), JSON.stringify(tsconfig));
  const list = ['tsconfig.json', ...files].map((p) => ({ path: p, lang: /\.(s?css|sass|less)$/.test(p) ? 'css' : 'typescript' }));
  return { resolve: createResolver(root, list), root };
}

test('tsconfig paths: the longest matching prefix wins, whatever order they are listed in', () => {
  const { resolve, root } = resolver(['src/app.ts', 'src/button.ts', 'src/components/button.ts', 'src/ui/button.ts'],
    { compilerOptions: { baseUrl: '.', paths: { '@/*': ['src/*'], '@/components/*': ['src/ui/*'] } } });
  try {
    assert.deepEqual(resolve({ path: 'src/app.ts', lang: 'typescript' }, { spec: '@/components/button' }), { file: 'src/ui/button.ts' });
    assert.deepEqual(resolve({ path: 'src/app.ts', lang: 'typescript' }, { spec: '@/button' }), { file: 'src/button.ts' });
  } finally { cleanup(root); }
});

test('stylesheets: an import of a .sass or .less file resolves to it', () => {
  const { resolve, root } = resolver(['styles/main.css', 'styles/theme.sass', 'styles/vars.less'], {});
  try {
    const css = (spec) => resolve({ path: 'styles/main.css', lang: 'css' }, { spec });
    assert.deepEqual(css('./theme'), { file: 'styles/theme.sass' });
    assert.deepEqual(css('./vars'), { file: 'styles/vars.less' });
  } finally { cleanup(root); }
});
