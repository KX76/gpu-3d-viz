import * as THREE from 'three';
import { isEnabled, type Sku, type Path } from '../model.ts';
import type { Endpoint } from '../engine.ts';
import type { Geometry } from './geometry.ts';
import { vector as v, type Point } from './types.ts';
const GREEN = '#677e75',
  DARK = '#343d48';
export function buildGpc(geometry: Geometry, sku: Sku, path: Path, lift: number) {
  const cols = Math.ceil(sku.maxTpcs / 2),
    pitch = 14 / cols;
  for (let t = 0; t < sku.maxTpcs; t++) {
    const x = ((t % cols) - (cols - 1) / 2) * pitch,
      z = (Math.floor(t / cols) - 0.5) * 4.8,
      p = [...path, t],
      active = isEnabled(sku, p);
    geometry.box(
      [x, 0.3 + lift, z],
      [pitch - 0.4, 0.16, 3.9],
      active ? GREEN : '#2b3e43',
      active ? p : undefined,
    );
    geometry.label(`TPC ${t}${active ? '' : ' / OFF'}`, [x, 1 + lift, z - 1.2], 2.4);
    for (let s = 0; s < 2; s++) {
      geometry.box(
        [x + (s - 0.5) * pitch * 0.39, 0.85 + lift, z + 0.35],
        [pitch * 0.31, 0.12, 1.8],
        active ? '#a3c68b' : '#405156',
        active ? p : undefined,
      );
    }
  }
  geometry.box([0, 0.1, 5.3], [13, 0.3, 0.75], '#5d92ac');
  geometry.label('TO SHARED L2', [0, 0.65, 5.3], 3);
  return genericPoints(geometry, sku, lift);
}
export function buildTpc(geometry: Geometry, sku: Sku, path: Path, lift: number) {
  for (let s = 0; s < 2; s++) {
    const x = (s - 0.5) * 7;
    geometry.box([x, 0.15 + lift, 0], [6, 0.18, 7.5], GREEN, [...path, s]);
    geometry.label(`SM ${s}`, [x, 1 + lift, -2.9], 3);
    for (let q = 0; q < 4; q++)
      geometry.box(
        [x + ((q % 2) - 0.5) * 2.65, 0.8 + lift, (Math.floor(q / 2) - 0.5) * 2.2],
        [2.3, 0.18, 1.8],
        '#8fac76',
        [...path, s],
      );
    geometry.box([x, 0.85 + lift, 2.7], [5.2, 0.3, 0.65], '#54879e', [...path, s]);
    geometry.label('L1 / SHARED', [x, 1.3 + lift, 2.7], 2.8);
  }
  return genericPoints(geometry, sku, lift);
}
function genericPoints(geometry: Geometry, sku: Sku, lift: number) {
  const p = {
    scheduler: v([-5, 1.5 + lift, -2]),
    register: v([-3, 1.5 + lift, -2]),
    fp32: v([-3, 1.5 + lift, 0]),
    tensor: v([-5, 1.5 + lift, 0]),
    ldst: v([-4, 1.5 + lift, 1]),
    l1: v([-3, 1 + lift, 3]),
    l2: v([0, 0.8, 5.3]),
    dram: v([8, 1, 5.3]),
  };
  const points = Array.from({ length: 4 }, () => p);
  geometry.box([8, 0.2, 5.3], [1.2, sku.package === 'gddr' ? 0.22 : 1.1, 1.3], '#a78b58');
  geometry.label(sku.memoryType, [8, 1.2, 5.3], 1.6);
  return points;
}
export function buildSm(geometry: Geometry, sku: Sku, path: Path, lift: number) {
  const detailed = path.length === 4;
  const subparts = detailed ? [path[3]] : [0, 1, 2, 3];
  const all: Record<Endpoint, THREE.Vector3>[] = [];
  for (const q of subparts) {
    const x = detailed ? 0 : ((q % 2) - 0.5) * 7.2,
      z = detailed ? -1 : (Math.floor(q / 2) - 0.5) * 5.1;
    const y = 0.35 + lift;
    const target = detailed ? undefined : [...path, q];
    geometry.box([x, y - 0.2, z], [6.65, 0.35, 4.65], DARK, target);
    if (!detailed) geometry.label(`PARTITION ${q}`, [x, y + 0.5, z - 2.05], 3.6, '#b3d0c8');
    const components: [Endpoint, string, Point, Point, string][] = [
      ['scheduler', 'SCHED + DISPATCH', [x - 1.65, y + 0.4, z - 1.15], [2.7, 0.4, 0.85], '#a6b887'],
      ['register', 'REGISTER FILE', [x + 1.5, y + 0.4, z - 1.15], [2.7, 0.4, 0.85], '#6f8fa4'],
      ['fp32', sku.arch.alu, [x - 1.65, y + 0.5, z + 0.15], [2.7, 0.55, 1.05], '#78a961'],
      ['tensor', 'TENSOR CORE', [x + 1.5, y + 0.5, z + 0.15], [2.7, 0.55, 1.05], '#8c7aab'],
      ['ldst', 'LD/ST + SFU', [x - 1.65, y + 0.4, z + 1.45], [2.7, 0.4, 0.85], '#b88c56'],
    ];
    const p = {} as Record<Endpoint, THREE.Vector3>;
    for (const [id, name, pos, size, color] of components) {
      geometry.box(pos, size, color, target);
      const compact: Record<string, string> = {
        scheduler: 'SCHEDULER',
        register: 'REGISTERS',
        fp32: sku.arch.alu,
        tensor: `TENSOR GEN ${sku.arch.tensorGen}`,
        ldst: 'LD/ST + SFU',
      };
      if (detailed) geometry.label(compact[id] ?? name, [pos[0], pos[1] + 0.48, pos[2]], 2.8);
      p[id] = v(pos).add(v([0, 0.6, 0]));
    }
    if (sku.arch.name === 'Ampere' || sku.arch.tmem) {
      geometry.box([x + 1.5, y + 0.4, z + 1.45], [2.7, 0.4, 0.85], '#4f7172', target);
      if (detailed) geometry.label(sku.arch.extra, [x + 1.5, y + 0.88, z + 1.45], 2.5);
    }
    p.l1 = v([0, 1, detailed ? 2.7 : 5.6]);
    p.l2 = v([0, 0.8, detailed ? 4.1 : 7.1]);
    p.dram = v([detailed ? 5.3 : 8.6, 1.6, detailed ? 3.2 : 5.6]);
    all[q] = p;
  }
  const l1z = detailed ? 2.7 : 5.6,
    l2z = detailed ? 4.1 : 7.1,
    hx = detailed ? 5.3 : 8.6,
    hz = detailed ? 3.2 : 5.6;
  geometry.box([0, 0.3, l1z], [detailed ? 9 : 13, 0.45, 0.9], '#527f9a');
  geometry.label(`L1 / SHARED · ${sku.arch.l1} KB`, [0, 0.95, l1z], detailed ? 4.6 : 6);
  geometry.box([0, 0.05, l2z], [detailed ? 7 : 9, 0.3, 0.65], '#386578');
  geometry.label('L2 · OUTSIDE SM', [0, 0.65, l2z], 4);
  geometry.box([hx, 0.3, hz], [1.45, sku.package === 'gddr' ? 0.25 : 1.6, 2], '#a58b58');
  geometry.label(sku.memoryType, [hx, 1.6, hz], 1.8);
  if (sku.arch.rt) {
    geometry.box([7.8, 0.4, -3.8], [1.5, 0.5, 2.4], '#9e8865');
    geometry.label(`RT GEN ${sku.arch.rt}`, [7.8, 1.1, -3.8], 2);
    geometry.label('1 RT / SM · 2 FP64 / SM', [0, 1, -6], 5);
  }
  if (sku.arch.tmem) {
    geometry.box([-8, 0.4, 1], [1.25, 0.5, 6], '#8776a8');
    geometry.label('TMEM · SM SHARED', [-8, 1.1, 1], 3);
  }
  return detailed ? Array.from({ length: 4 }, () => all[path[3]]) : all;
}
