import test from 'node:test';
import assert from 'node:assert/strict';
import {createRelationEcho} from '../src/components/relationEcho.mjs';

function fixture({missing = [], throwing = []} = {}) {
  const calls = [];
  const attrs = new Map();
  const targets = Object.fromEntries(['line','halo','thread','sheet'].map(name => [name, {
    animate(frames, options) {
      if (throwing.includes(name)) throw new Error('Unsupported animation');
      let resolve, reject;
      const finished = new Promise((yes,no) => { resolve = yes; reject = no; });
      const call = {name, frames, options, resolve, cancels: 0};
      const animation = {finished, cancel() { call.cancels += 1; reject(new Error('Cancelled')); }};
      call.animation = animation;
      calls.push(call);
      return animation;
    }
  }]));
  const find = selector => {
    const name = selector.match(/="([^"]+)"/)?.[1];
    return missing.includes(name) ? null : targets[name];
  };
  const root = {
    querySelector: find,
    setAttribute: (name,value) => attrs.set(name,value),
    removeAttribute: name => attrs.delete(name)
  };
  return {root, sheet: {querySelector: find}, calls, attrs};
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

test('selection has four bounded single-pass accents and no persistent forwards fill', () => {
  const f = fixture(), echo = createRelationEcho();
  assert.equal(echo.play(f), 4);
  assert.equal(f.attrs.get('data-relation-echo'), 'running');
  for (const {options} of f.calls) {
    assert.equal(options.iterations, 1);
    assert.equal(options.fill, 'backwards');
    assert.ok(options.duration + (options.delay || 0) <= 720);
  }
  echo.cancel();
});

test('cancellation removes every owned effect and leaves the reading state untouched', async () => {
  const f = fixture(), echo = createRelationEcho();
  echo.play(f);
  echo.cancel();
  echo.cancel();
  assert.equal(f.attrs.has('data-relation-echo'), false);
  assert.ok(f.calls.every(call => call.cancels === 1));
  await flush();
});

test('a newer selection cannot be cleared by older completion callbacks', async () => {
  const f = fixture(), echo = createRelationEcho();
  echo.play(f);
  const first = f.calls.slice();
  echo.play(f);
  first.forEach(call => call.resolve());
  await flush();
  assert.equal(f.attrs.get('data-relation-echo'), 'running');
  assert.ok(first.every(call => call.cancels === 1));
  f.calls.slice(4).forEach(call => call.resolve());
  await flush();
  assert.equal(f.attrs.has('data-relation-echo'), false);
});

test('natural completion releases the effects instead of keeping finished fill layers', async () => {
  const f = fixture(), echo = createRelationEcho();
  echo.play(f);
  f.calls.forEach(call => call.resolve());
  await flush();
  assert.equal(f.attrs.has('data-relation-echo'), false);
  assert.ok(f.calls.every(call => call.cancels === 1));
});

test('reduced motion and hidden tabs create no effects', async () => {
  const f = fixture(), echo = createRelationEcho();
  assert.equal(echo.play({...f, reduced: true}), 0);
  assert.equal(echo.play({...f, hidden: true}), 0);
  assert.equal(f.calls.length, 0);
  echo.play(f);
  echo.play({...f, reduced: true});
  assert.equal(f.attrs.has('data-relation-echo'), false);
  await flush();
});

test('mobile uses only a brief opacity change, with no translation or perspective', () => {
  const f = fixture(), echo = createRelationEcho();
  assert.equal(echo.play({...f, desktop: false}), 1);
  assert.equal(f.calls[0].name, 'sheet');
  assert.equal(f.calls[0].options.duration, 140);
  assert.ok(f.calls[0].frames.every(frame => !('transform' in frame) && frame.opacity >= .8));
  echo.cancel();
});

test('list reading has no hidden graph animation', () => {
  const f = fixture(), echo = createRelationEcho();
  assert.equal(echo.play({...f, list: true}), 1);
  assert.deepEqual(f.calls.map(call => call.name), ['sheet']);
  echo.cancel();
});

test('missing or unsupported animation targets leave static content available', () => {
  const empty = fixture({missing: ['line','halo','thread','sheet']});
  const echo = createRelationEcho();
  assert.equal(echo.play(empty), 0);
  assert.equal(empty.attrs.has('data-relation-echo'), false);
  const partial = fixture({throwing: ['line']});
  assert.equal(echo.play(partial), 3);
  echo.cancel();
});

test('paper is readable from its first frame and close controls are not targets', () => {
  const f = fixture(), echo = createRelationEcho();
  echo.play(f);
  const paper = f.calls.find(call => call.name === 'sheet');
  assert.ok(paper.frames.every(frame => frame.opacity >= .68));
  assert.deepEqual(f.calls.map(call => call.name), ['line','halo','thread','sheet']);
  echo.cancel();
});
