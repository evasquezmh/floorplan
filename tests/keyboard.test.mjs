// Map shortcuts stay out of the way of typing: keys pressed in a text box (the flow request is a textarea) or with
// a dialog open don't drive the map, and Stop cancels only the question it was pressed for. Checks on the page's
// code, like touch.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SKILL } from './helpers.mjs';

const html = fs.readFileSync(path.join(SKILL, 'assets', 'viewer.html'), 'utf8');
const handler = html.slice(html.indexOf("window.addEventListener('keydown'"), html.indexOf('// ======================= extension API'));

test('shortcuts skip every kind of text box, not only <input>', () => {
  assert.match(handler, /ev\.target\.closest\?\.\('input, textarea, select, \[contenteditable\]'\)\) return;/);
  assert.doesNotMatch(handler, /tagName === 'INPUT'/);
});

test('with a dialog open, Escape closes it and no other key reaches the map', () => {
  const guard = handler.indexOf("modal.classList.contains('open')");
  assert.ok(guard > 0 && guard < handler.indexOf("ev.key === 'Backspace'"), 'checked before Backspace goes up a level');
});

test('Stop sends the id of the run it cancels', () => {
  assert.match(html, /if \(ev === 'start'\) askState\.run = data\.id;/);
  assert.match(html, /fetch\('\/api\/cancel', .*body: JSON\.stringify\(\{ id: askState\.run \}\)/);
});
