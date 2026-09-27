import * as THREE from 'three';
import type { Sku } from '../model.ts';
import type { Geometry } from './geometry.ts';
import { vector as v, type Point } from './types.ts';
export function buildHbmPackage(geometry: Geometry, sku: Sku, lift: number) {
  // Package silhouette: organic substrate, interposer, thin silicon, stacked HBM.
  geometry.solid([0, -0.77, 0], [23, 0.32, 18], '#193b2e', 0.22, 0.68);
  geometry.surface([0, -0.602, 0], [22.96, 17.96], 'substrate');
  geometry.solid([0, -0.47, 0], [20.9, 0.2, 13.8], '#33343b', 0.83, 0.29);
  geometry.solid([0, -0.29, 0], [15.9, 0.16, 10.8], '#a7b3bf', 0.95, 0.18);
  geometry.solid([0, -0.16, 0], [15.55, 0.14, 10.48], '#252936', 0.88, 0.22);
  geometry.surface([0, -0.083, 0], [15.5, 10.43], 'logic');
  for (let g = 0; g < 8; g++) {
    const x = ((g % 4) - 1.5) * 3.78,
      z = (Math.floor(g / 4) - 0.5) * 4.92,
      active = sku.tpcs[g] > 0;
    const y = -0.025 + lift;
    geometry.solid(
      [x, y - 0.035, z],
      [3.65, 0.07, 4.52],
      active ? '#696573' : '#313942',
      0.86,
      0.25,
    );
    geometry.surface([x, y + 0.006, z], [3.62, 4.49], 'logic', active ? [g] : undefined, !active);
    geometry.label(
      `GPC ${g}${active ? '' : ' / OFF'}`,
      [x, y + 0.45, z],
      2.2,
      active ? '#d5eac5' : '#89908c',
    );
    // Disabled TPC overlays are schematic locations, not an actual fuse map.
    if (active)
      for (let t = sku.tpcs[g]; t < 8; t++) {
        const tx = x + ((t % 2) - 0.5) * 1.78,
          tz = z + (Math.floor(t / 2) - 1.5) * 1.09;
        geometry.surface([tx, y + 0.012, tz], [1.7, 1.02], 'logic', undefined, true);
      }
  }
  geometry.surface([0, 0.03, 0], [15.1, 0.32], 'memory');
  geometry.label('L2 CACHE', [0, 0.42, 0], 2.4, '#c3e1ec');
  // Fine interposer routing, drawn in one buffer instead of hundreds of meshes.
  const wires: number[] = [];
  for (const side of [-1, 1])
    for (let h = 0; h < 3; h++)
      for (let i = 0; i < 64; i++) {
        const z = (h - 1) * 4.15 + (i - 31.5) * 0.037;
        wires.push(
          side * 7.98,
          -0.345,
          z,
          side * 8.5,
          -0.345,
          z,
          side * 8.5,
          -0.345,
          z,
          side * 8.72,
          -0.345,
          z + 0.15,
        );
      }
  const traces = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(wires, 3)),
    new THREE.LineBasicMaterial({ color: '#bc9b68', transparent: true, opacity: 0.58 }),
  );
  geometry.content.add(traces);
  for (let h = 0; h < 6; h++) {
    const x = h < 3 ? -9.4 : 9.4,
      z = ((h % 3) - 1) * 4.15,
      active = h < sku.hbmStacks,
      y = lift * 0.35;
    geometry.solid([x, -0.22 + y, z], [2.18, 0.23, 3.45], '#383335', 0.35, 0.6);
    for (let layer = 0; layer < 5; layer++)
      geometry.solid(
        [x, -0.08 + layer * 0.047 + y, z],
        [2.04, 0.032, 3.29],
        layer % 2 ? '#63636b' : '#292a30',
        0.6,
        0.35,
      );
    geometry.solid([x, 0.2 + y, z], [2.06, 0.12, 3.32], active ? '#22272e' : '#222426', 0.42, 0.32);
    geometry.surface(
      [x, 0.266 + y, z],
      [2.04, 3.3],
      'hbm',
      undefined,
      !active,
      active ? '#ffffff' : '#55585a',
    );
    geometry.label(active ? `${sku.memoryType} ${h}` : 'OFF', [x, 0.7 + y, z], 1.8, '#c6c9cb');
  }
  const caps: Point[] = [],
    pads: Point[] = [],
    ends: Point[] = [];
  for (const side of [-1, 1])
    for (let i = 0; i < 35; i++) {
      const x = (i - 17) * 0.53,
        z = side * 7.46;
      caps.push([x, -0.44, z]);
      ends.push([x - 0.13, -0.44, z], [x + 0.13, -0.44, z]);
      pads.push([x, -0.594, side * 8.42]);
    }
  for (const side of [-1, 1])
    for (let i = 0; i < 29; i++) {
      const z = (i - 14) * 0.49;
      pads.push([side * 11.13, -0.594, z]);
      caps.push([side * 10.93, -0.44, z]);
      ends.push([side * 10.8, -0.44, z], [side * 11.06, -0.44, z]);
    }
  geometry.instances(pads, [0.18, 0.035, 0.18], '#baa36d');
  geometry.instances(caps, [0.3, 0.16, 0.14], '#3f4448');
  geometry.instances(ends, [0.055, 0.175, 0.16], '#aeb0b0');
  for (const x of [-10.55, 10.55])
    for (const z of [-8, 8]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.2, 0.045, 8, 24),
        new THREE.MeshStandardMaterial({ color: '#d3b86e', metalness: 0.9, roughness: 0.25 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, -0.57, z);
      geometry.content.add(ring);
    }
  geometry.silkscreen(
    `GPU ATLAS / ${sku.name.toUpperCase()} / PACKAGE STUDY`,
    [0, -0.594, 8.15],
    13,
  );
  geometry.label('NVLink / PCIe', [0, -0.1, 6.35], 3);
  const a = v([-5.67, 0.22 + lift, -2.46]);
  return Array.from({ length: 4 }, () => ({
    scheduler: a,
    register: a.clone().add(v([0.9, 0, 0])),
    fp32: a.clone().add(v([1.8, 0, 0])),
    tensor: a.clone().add(v([1.2, 0, 1])),
    ldst: a.clone().add(v([0, 0, 1])),
    l1: v([-5.67, 0.22 + lift, -0.7]),
    l2: v([0, 0.2, 0]),
    dram: v([9.4, 0.4 + lift * 0.35, -4.15]),
  }));
}
export function buildBoardPackage(geometry: Geometry, sku: Sku, lift: number) {
  const dual = sku.package === 'dual-hbm';
  geometry.solid([0, -0.77, 0], [23, 0.32, 18], dual ? '#214034' : '#202e29', 0.25, 0.67);
  geometry.surface([0, -0.602, 0], [22.96, 17.96], 'substrate');
  if (dual) {
    geometry.solid([0, -0.42, 0], [21, 0.3, 14.7], '#777b85', 0.85, 0.29);
    for (const x of [-4, 4]) {
      geometry.solid([x, -0.16, 0], [7.4, 0.2, 11.9], '#242832');
      geometry.surface([x, -0.055, 0], [7.36, 11.86], 'logic');
    }
    geometry.surface([0, 0.02, 0], [0.55, 10.7], 'memory');
    geometry.label('NV-HBI', [0, 0.8, 0], 2.2, '#bfcfe5');
  } else {
    geometry.solid([0, -0.35, 0], [11.1, 0.45, 11.1], '#326459', 0.4, 0.44);
    geometry.solid([0, -0.05, 0], [9.6, 0.18, 9.6], '#989ba4', 0.95, 0.2);
    geometry.surface([0, 0.047, 0], [9.52, 9.52], 'logic');
  }
  for (let g = 0; g < sku.tpcs.length; g++) {
    const active = sku.tpcs[g] > 0;
    const x = dual ? (g < 4 ? -4 : 4) + (((g % 4) % 2) - 0.5) * 3.52 : ((g % 4) - 1.5) * 2.3;
    const z = dual ? (Math.floor((g % 4) / 2) - 0.5) * 5.64 : (Math.floor(g / 4) - 1) * 3.05;
    const y = 0.09 + lift,
      w = dual ? 3.37 : 2.16,
      d = dual ? 5.36 : 2.9;
    geometry.solid([x, y - 0.03, z], [w, 0.06, d], active ? '#787780' : '#303a3e', 0.83, 0.28);
    geometry.surface(
      [x, y + 0.006, z],
      [w - 0.02, d - 0.02],
      'logic',
      active ? [g] : undefined,
      !active,
    );
    geometry.label(`GPC ${g}${active ? '' : ' / OFF'}`, [x, y + 0.5, z], dual ? 2.25 : 1.85);
  }
  if (dual) for (const [i, x] of [-4, 4].entries()) geometry.label(`DIE ${i}`, [x, 0.2, -6.7], 2.8);
  const count = dual ? 8 : sku.memoryPackages;
  for (let h = 0; h < count; h++) {
    let x: number, z: number;
    if (dual) {
      x = h < 4 ? -9.3 : 9.3;
      z = ((h % 4) - 1.5) * 3.25;
    } else {
      const perSide = count / 4,
        side = Math.floor(h / perSide),
        offset = ((h % perSide) - (perSide - 1) / 2) * 2.95;
      x = side < 2 ? offset : side === 2 ? -6.8 : 6.8;
      z = side < 2 ? (side === 0 ? -6.8 : 6.8) : offset;
    }
    const y = lift * 0.35,
      w = dual ? 2.0 : 2.25,
      d = dual ? 2.7 : 1.65;
    if (dual)
      for (let layer = 0; layer < 6; layer++)
        geometry.solid(
          [x, -0.12 + layer * 0.05 + y, z],
          [w, 0.035, d],
          layer % 2 ? '#62646d' : '#30323a',
        );
    geometry.solid([x, 0.25 + y, z], [w, 0.25, d], '#24272e', 0.35, 0.43);
    geometry.surface([x, 0.38 + y, z], [w - 0.03, d - 0.03], 'hbm');
    geometry.label(`${sku.memoryType} ${h}`, [x, 0.85 + y, z], 2);
  }
  const caps: Point[] = [],
    ends: Point[] = [];
  for (let i = 0; i < 34; i++)
    for (const sign of [-1, 1]) {
      const x = (i - 16.5) * 0.55,
        z = sign * 8.1;
      caps.push([x, -0.4, z]);
      ends.push([x - 0.12, -0.4, z], [x + 0.12, -0.4, z]);
    }
  geometry.instances(caps, [0.28, 0.19, 0.14], '#42494a');
  geometry.instances(ends, [0.05, 0.2, 0.16], '#b3b2b6');
  if (!dual) {
    const contacts: Point[] = [];
    for (let i = 0; i < 56; i++) contacts.push([-8.7 + i * 0.24, -0.59, 8.75]);
    geometry.instances(contacts, [0.15, 0.03, 0.45], '#c0a76e');
    for (let i = 0; i < 10; i++) {
      geometry.solid([-9.6, -0.1, (i - 4.5) * 1.43], [1.25, 0.7, 0.92], '#565962', 0.6, 0.4);
      geometry.solid([9.6, -0.23, (i - 4.5) * 1.43], [0.9, 0.45, 0.72], '#32363c');
    }
  }
  geometry.silkscreen(
    `${sku.name.toUpperCase()} / ${dual ? 'DUAL DIE PACKAGE' : 'PCB STUDY'}`,
    [0, -0.592, -8.63],
    16,
  );
  const a = v([dual ? -5.76 : -3.45, 0.5 + lift, dual ? -2.82 : -3.05]);
  return Array.from({ length: 4 }, () => ({
    scheduler: a,
    register: a.clone().add(v([0.6, 0, 0])),
    fp32: a.clone().add(v([1.2, 0, 0])),
    tensor: a.clone().add(v([0.6, 0, 0.5])),
    ldst: a.clone().add(v([0, 0, 0.8])),
    l1: a.clone().add(v([0, 0, 1.2])),
    l2: v([0, 0.5, 0]),
    dram: v([dual ? 9.3 : 6.8, 0.6 + lift * 0.35, -1.5]),
  }));
}
