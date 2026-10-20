import test from 'node:test';
import assert from 'node:assert/strict';
import { canvasSize, createFrameGate } from '../src/utils/renderBudget.js';

for (const hz of [60, 90, 120, 144, 165, 240]) {
  test(`decorative rendering stays at 30fps on a ${hz}Hz clock`, () => {
    const gate = createFrameGate(30);
    let count = 0;
    for (let frame = 0; frame < hz * 10; frame++) {
      if (gate.ready(frame * 1000 / hz)) count++;
    }
    assert.ok(Math.abs(count - 300) <= 1);
    assert.equal(gate.ready(50000), true);
    assert.equal(gate.ready(50001), false, 'suspension must not cause catch-up draws');
    gate.reset();
    assert.equal(gate.ready(50002), true);
  });
}

test('canvas budget preserves aspect ratio across desktop, 4K and mobile', () => {
  for (const [width, height, dpr] of [[1905,1080,1], [1905,1502,1], [3825,2160,2], [390,844,3]]) {
    const size = canvasSize(width, height, dpr);
    assert.ok(size.width * size.height <= 1_500_000);
    assert.ok(Math.abs(size.width / size.height - width / height) < 0.01);
    assert.ok(size.width > 0 && size.height > 0);
  }
});
