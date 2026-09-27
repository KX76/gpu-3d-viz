import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SKUS, childCount, isEnabled, type Path } from '../src/model.ts';
import { STAGES } from '../src/engine.ts';
import type { Geometry } from '../src/render/geometry.ts';
import { buildHbmPackage, buildBoardPackage } from '../src/render/packages.ts';
import { buildGpc, buildTpc, buildSm } from '../src/render/hierarchy.ts';

// CPU-only drawing recorder: tests actual builders without needing a WebGL context.
function drawingRecorder() {
  const paths: Path[] = [];
  const content = new THREE.Group();
  const record = (_position: unknown, _size: unknown, _material: unknown, path?: Path) => {
    if (path) paths.push(path);
    return new THREE.Object3D();
  };
  const geometry = {
    content,
    solid: () => new THREE.Object3D(),
    surface: record,
    box: record,
    instances: () => {},
    silkscreen: () => {},
    label: () => {},
  } as unknown as Geometry;
  return { geometry, paths };
}

test('all SKU builders expose enabled child targets and finite routes at every level', () => {
  for (const sku of Object.values(SKUS)) {
    const g = sku.tpcs.findLastIndex((n) => n > 0);
    const lastSm = [g, sku.tpcs[g] - 1, 1];
    for (const path of [[], [g], lastSm.slice(0, 2), lastSm, [...lastSm, 3]])
      for (const lift of [0, 2.5]) {
        const { geometry, paths } = drawingRecorder();
        const points =
          path.length === 0
            ? (sku.package === 'hbm' ? buildHbmPackage : buildBoardPackage)(geometry, sku, lift)
            : path.length === 1
              ? buildGpc(geometry, sku, path, lift)
              : path.length === 2
                ? buildTpc(geometry, sku, path, lift)
                : buildSm(geometry, sku, path, lift);
        assert.equal(points.length, 4, `${sku.id} ${path}`);
        for (const partition of points)
          for (const stage of STAGES)
            for (const endpoint of [stage.from, stage.to]) {
              assert.ok(
                partition[endpoint]?.toArray().every(Number.isFinite),
                `${sku.id}: ${endpoint}`,
              );
            }
        const expected = Array.from({ length: childCount(sku, path) }, (_, i) => [...path, i])
          .filter((p) => isEnabled(sku, p))
          .map((p) => p.join('/'));
        assert.deepEqual(
          new Set(paths.map((p) => p.join('/'))),
          new Set(expected),
          `${sku.id} ${path}`,
        );
        geometry.content.traverse((object) => {
          const mesh = object as THREE.Mesh;
          mesh.geometry?.dispose();
          for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
            material?.dispose();
        });
      }
  }
});
