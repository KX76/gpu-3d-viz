import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { Script } from 'node:vm';
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
test('delivery is a single HTML with no externally loaded entry assets', () => {
  assert.deepEqual(readdirSync(new URL('../dist/', import.meta.url)), ['index.html']);
  assert.doesNotMatch(html, /<(?:script|link|img|iframe)\b[^>]*\b(?:src|href)\s*=/i);
  assert.doesNotMatch(html, /<script\b[^>]*\btype\s*=\s*["']module/i);
  const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];
  assert.equal(styles.length, 1);
  assert.doesNotMatch(styles[0][1], /@import\b|url\(\s*["']?(?!data:)[^\s"')]+/i);
  assert.ok(html.includes('<div id="app"></div>'));
});
test('inline entry is valid classic JavaScript without module resolution', () => {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Script(scripts[0][1], { filename: 'gpu-atlas-offline.js' }));
  for (const model of ['A800', '4090 D', 'PRO 5000', '5090', 'PRO 6000', 'B200'])
    assert.ok(scripts[0][1].includes(model));
});
