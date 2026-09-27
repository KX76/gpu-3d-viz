import { description } from '../src/ui/details.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SKUS, isEnabled, childCount, smId } from '../src/model.ts';
import { DURATION, STAGES, warpState, eventsForLoop, toJSONL } from '../src/engine.ts';
test('all six featured GPUs have their product SM and CUDA core counts', () => {
  const expected = {
    a800: [108, 6912],
    '4090d': [114, 14592],
    pro5000: [110, 14080],
    '5090': [170, 21760],
    pro6000: [188, 24064],
    b200: [148, 18944],
  };
  assert.equal(Object.values(SKUS).filter((s) => s.featured).length, 6);
  for (const [id, [sms, cores]] of Object.entries(expected)) {
    const sku = SKUS[id as keyof typeof SKUS];
    assert.equal(sku.smCount, sms);
    assert.equal(sku.smCount * sku.arch.fp32, cores);
  }
});
test('every SKU can reach exactly its enabled SMs with unique layout IDs', () => {
  for (const sku of Object.values(SKUS)) {
    const ids = new Set<number>();
    for (let g = 0; g < childCount(sku, []); g++)
      for (let t = 0; t < childCount(sku, [g]); t++)
        for (let s = 0; s < 2; s++)
          if (isEnabled(sku, [g, t, s])) {
            ids.add(smId(sku, [g, t, s]));
            for (let q = 0; q < 4; q++) assert.ok(isEnabled(sku, [g, t, s, q]));
          }
    assert.equal(ids.size, sku.smCount, sku.name);
    for (const path of [
      [-1],
      [0.5],
      [NaN],
      [sku.tpcs.length],
      [0, sku.maxTpcs],
      [0, 0, 2],
      [0, 0, 0, 4],
      [0, 0, 0, 0, 0],
    ])
      assert.equal(isEnabled(sku, path), false);
  }
});
test('architecture and packaging distinguish consumer and datacenter Blackwell', () => {
  for (const id of ['4090d', 'pro5000', '5090', 'pro6000'] as const) {
    assert.equal(SKUS[id].package, 'gddr');
    assert.equal(SKUS[id].hbmStacks, 0);
    assert.ok(SKUS[id].arch.rt > 0);
  }
  assert.equal(SKUS.b200.package, 'dual-hbm');
  assert.equal(SKUS.b200.hbmStacks, 8);
  assert.equal(SKUS.b200.arch.cc, '10.0');
  assert.equal(SKUS.b200.arch.tmem, true);
  assert.equal(SKUS['5090'].arch.cc, '12.0');
  assert.equal(SKUS['5090'].arch.tmem, false);
  assert.equal(SKUS.a800.arch.l1, 192);
  assert.equal(SKUS['4090d'].arch.l1, 128);
  assert.equal(SKUS.b200.arch.l1, 256);
  assert.ok(description(SKUS['5090'], [0, 0, 0, 0]).includes('共用'));
});
test('every tick/warp has a valid deterministic stage and partition', () => {
  for (let w = 0; w < 8; w++)
    for (let t = 0; t < DURATION; t++) {
      const s = warpState(t, w);
      assert.ok(s.progress >= 0 && s.progress < 1);
      assert.equal(s.subpart, w % 4);
      assert.deepEqual(warpState(t + DURATION, w), s);
    }
});
test('exported transitions match visible events and include the selected SKU', () => {
  const events = eventsForLoop(6);
  assert.equal(events.length, 8 * STAGES.length);
  for (const sku of Object.values(SKUS)) {
    const exported = toJSONL(6, sku)
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    assert.equal(exported.length, events.length);
    for (const e of exported) {
      assert.equal(e.sku, sku.id);
      assert.equal(e.memoryType, sku.memoryType);
      assert.equal(e.computeCapability, sku.arch.cc);
      assert.equal(e.smIdKind, 'schematic-layout');
    }
  }
  for (let i = 0; i < events.length; i++) {
    const e = events[i],
      visible = warpState(e.cycle, e.warp);
    assert.equal(e.event, visible.event);
    assert.equal(e.from, visible.from);
    assert.equal(e.to, visible.to);
    assert.equal(e.sm, 6);
    assert.equal(e.source, 'schematic');
    assert.equal(e.timeUnit, 'teaching-tick');
    if (i) assert.ok(events[i - 1].cycle <= e.cycle);
  }
});
