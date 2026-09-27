import * as THREE from 'three';
import { ChipSurfaces, type SurfaceKind } from '../surfaces.ts';
import type { Path } from '../model.ts';
import type { Point } from './types.ts';
/** Owns drawing helpers; the scene owns disposal of their meshes and materials. */
export class Geometry {
  annotations = false;
  constructor(
    public content: THREE.Group,
    public hitTargets: THREE.Mesh[],
    private surfaces: ChipSurfaces,
  ) {}
  solid(p: Point, size: Point, color: string, metalness = 0.65, roughness = 0.35) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...size),
      new THREE.MeshStandardMaterial({ color, metalness, roughness }),
    );
    mesh.position.set(...p);
    this.content.add(mesh);
    return mesh;
  }
  surface(
    p: Point,
    size: [number, number],
    kind: SurfaceKind,
    path?: Path,
    disabled = false,
    tint = '#ffffff',
  ) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(...size),
      this.surfaces.material(kind, disabled, tint),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(...p);
    this.content.add(mesh);
    if (path) {
      mesh.userData.path = path;
      this.hitTargets.push(mesh);
    }
    return mesh;
  }
  box(p: Point, size: Point, color: string, path?: Path) {
    const mesh = this.solid(p, size, new THREE.Color(color).multiplyScalar(0.38).getStyle());
    if (path) {
      mesh.userData.path = path;
      this.hitTargets.push(mesh);
    }
    const kind: SurfaceKind = size[0] > size[2] * 3 ? 'memory' : 'logic';
    const tint = new THREE.Color(color).lerp(new THREE.Color('#ccd0d5'), 0.75).getStyle();
    this.surface(
      [p[0], p[1] + size[1] / 2 + 0.005, p[2]],
      [size[0] * 0.986, size[2] * 0.986],
      kind,
      path,
      false,
      tint,
    );
    return mesh;
  }
  instances(positions: Point[], size: Point, color: string) {
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(...size),
      new THREE.MeshStandardMaterial({ color, metalness: 0.76, roughness: 0.29 }),
      positions.length,
    );
    const matrix = new THREE.Matrix4();
    positions.forEach((p, i) => {
      matrix.makeTranslation(...p);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    this.content.add(mesh);
    return mesh;
  }
  silkscreen(text: string, p: Point, width: number) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#a6b3a0';
    ctx.font = '28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, 512, 75);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, width / 8),
      new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(...p);
    this.content.add(mesh);
  }
  label(text: string, p: Point, width = 2.4, color = '#d9ece5') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 96);
    ctx.fillStyle = color;
    const fontSize = Math.min(64, Math.floor(490 / (text.length * 0.62)));
    ctx.font = `600 ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labelWidth = ctx.measureText(text).width + 20;
    ctx.fillStyle = '#10272be6';
    ctx.fillRect(256 - labelWidth / 2, 8, labelWidth, 80);
    ctx.fillStyle = color;
    ctx.fillText(text, 256, 48);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map, depthTest: false, transparent: true, opacity: 0.95 }),
    );
    sprite.userData.annotation = true;
    sprite.visible = this.annotations;
    sprite.position.set(...p);
    sprite.scale.set(width, (width * 96) / 512, 1);
    sprite.renderOrder = 2;
    this.content.add(sprite);
  }
  line(points: THREE.Vector3[], color: string, opacity = 0.25) {
    const curve = new THREE.CatmullRomCurve3(points);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
    );
    line.userData.annotation = true;
    line.visible = this.annotations;
    this.content.add(line);
    return curve;
  }
}
