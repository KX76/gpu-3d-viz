import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChipSurfaces } from './surfaces.ts';
import { gsap } from 'gsap';
import { COLORS, type Path, type Sku } from './model.ts';
import { warpState, type Endpoint } from './engine.ts';

import { Geometry } from './render/geometry.ts';
import { vector as v } from './render/types.ts';
import { buildHbmPackage, buildBoardPackage } from './render/packages.ts';
import { buildGpc, buildTpc, buildSm } from './render/hierarchy.ts';
export class GpuScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  private controls: OrbitControls;
  private content = new THREE.Group();
  private hitTargets: THREE.Mesh[] = [];
  private particles!: THREE.InstancedMesh;
  private routes: THREE.CatmullRomCurve3[] = [];
  private routeKeys: string[] = [];
  private points: Record<Endpoint, THREE.Vector3>[] = [];
  private raycaster = new THREE.Raycaster();
  private matrix = new THREE.Object3D();
  private observer: ResizeObserver;
  private down = { x: 0, y: 0 };
  private hovered?: THREE.Mesh;
  private disposed = false;
  private surfaces: ChipSurfaces;
  private environment: THREE.WebGLRenderTarget;
  private annotations = false;
  private tooltip: HTMLDivElement;
  private span = 23;
  private geometry: Geometry;
  private path: Path = [];
  private selected = 0;
  private tick = 0;
  constructor(
    private host: HTMLElement,
    private onPick: (path: Path) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor('#101b21', 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.surfaces = new ChipSurfaces(Math.min(8, this.renderer.capabilities.getMaxAnisotropy()));
    this.geometry = new Geometry(this.content, this.hitTargets, this.surfaces);
    const environmentScene = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(environmentScene, 0.04);
    this.scene.environment = this.environment.texture;
    environmentScene.dispose();
    pmrem.dispose();
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'chip-tooltip';
    host.append(this.tooltip);
    this.renderer.domElement.setAttribute(
      'aria-label',
      'GPU 三维模型，拖动旋转、滚轮缩放、点击下钻',
    );
    host.append(this.renderer.domElement);
    this.camera.position.set(17, 22, 24);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.minDistance = 7;
    this.controls.maxDistance = 65;
    this.controls.enablePan = true;
    this.scene.add(new THREE.HemisphereLight('#dce5ea', '#1f232c', 1.25));
    const key = new THREE.DirectionalLight('#fff1de', 3);
    key.position.set(6, 16, 7);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight('#a9cafa', 1.4);
    rim.position.set(-10, 5, -8);
    this.scene.add(rim);
    const grid = new THREE.GridHelper(80, 40, '#22323a', '#16262c');
    grid.position.y = -1.2;
    this.scene.add(grid);
    this.scene.fog = new THREE.Fog('#101b21', 38, 90);
    this.scene.add(this.content);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.renderer.domElement.addEventListener('pointerdown', this.pointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.pointerUp);
    this.renderer.domElement.addEventListener('pointermove', this.pointerMove);
    this.renderer.domElement.addEventListener('pointerleave', this.pointerLeave);
  }
  private resize() {
    const { width, height } = this.host.getBoundingClientRect();
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (this.particles) this.resetCamera();
  }
  private intersect(event: PointerEvent) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.raycaster.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - r.left) / r.width) * 2 - 1,
        (-(event.clientY - r.top) / r.height) * 2 + 1,
      ),
      this.camera,
    );
    return this.raycaster.intersectObjects(this.hitTargets)[0]?.object as THREE.Mesh | undefined;
  }
  private pointerDown = (e: PointerEvent) => {
    this.down = { x: e.clientX, y: e.clientY };
  };
  private pointerUp = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 5) return;
    const hit = this.intersect(e);
    if (hit) this.onPick(hit.userData.path);
  };
  private pointerLeave = () => {
    if (this.hovered) (this.hovered.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
    this.hovered = undefined;
    this.tooltip.hidden = true;
  };
  private pointerMove = (e: PointerEvent) => {
    const hit = this.intersect(e);
    if (this.hovered !== hit) {
      if (this.hovered) (this.hovered.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
      this.hovered = hit;
      if (hit) (hit.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.25;
      this.host.style.cursor = hit ? 'pointer' : 'grab';
    }
    this.tooltip.hidden = !hit;
    if (hit) {
      const path = hit.userData.path as Path,
        r = this.host.getBoundingClientRect();
      this.tooltip.textContent = `${['', 'GPC', 'TPC', 'SM', 'Partition'][path.length]} ${path.at(-1)}  ·  点击进入`;
      this.tooltip.style.left = `${Math.min(e.clientX - r.left + 14, r.width - 160)}px`;
      this.tooltip.style.top = `${e.clientY - r.top - 32}px`;
    }
  };
  private clear() {
    this.hovered = undefined;
    this.tooltip.hidden = true;
    this.content.traverse((object) => {
      const obj = object as THREE.Mesh;
      obj.geometry?.dispose();
      if (object instanceof THREE.InstancedMesh) object.dispose();
      if (obj.material)
        for (const mat of Array.isArray(obj.material) ? obj.material : [obj.material]) {
          const map = (mat as THREE.SpriteMaterial).map;
          if (map && !map.userData.shared) map.dispose();
          mat.dispose();
        }
    });
    this.content.clear();
    this.hitTargets.length = 0;
    this.points = [];
    this.routes = [];
    this.routeKeys = [];
  }
  build(sku: Sku, path: Path, explode: number, fly = true) {
    this.clear();
    this.path = [...path];
    const lift = explode * 2.5;
    const l = path.length;
    this.span = l === 0 ? 25 : l < 3 ? 17 : l === 3 ? 21 : 17;
    if (l > 0) {
      const w = l === 4 ? 13 : 17,
        d = l === 4 ? 10 : 13;
      this.geometry.solid([0, -0.75, 0], [w, 0.22, d], '#222731');
      this.geometry.surface([0, -0.633, 0], [w, d], 'logic');
    }
    if (l === 0) {
      this.points =
        sku.package === 'hbm'
          ? buildHbmPackage(this.geometry, sku, lift)
          : buildBoardPackage(this.geometry, sku, lift);
    } else if (l === 1) this.points = buildGpc(this.geometry, sku, path, lift);
    else if (l === 2) this.points = buildTpc(this.geometry, sku, path, lift);
    else this.points = buildSm(this.geometry, sku, path, lift);
    this.particles = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.075, 10, 8),
      new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      8,
    );
    this.particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.particles.frustumCulled = false;
    this.particles.userData.annotation = true;
    this.particles.visible = this.annotations;
    this.content.add(this.particles);
    // Faint guide routes represent the shared memory hierarchy for the current teaching SM.
    const p = this.points[0];
    this.geometry.line([p.ldst, p.l1, p.l2, p.dram], COLORS.memory, 0.3);
    this.update(this.tick, this.selected);
    if (fly) this.resetCamera();
  }
  setAnnotations(enabled: boolean) {
    this.annotations = enabled;
    this.geometry.annotations = enabled;
    this.content.traverse((object) => {
      if (object.userData.annotation) object.visible = enabled;
    });
  }
  resetCamera(top = false) {
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);
    const d = this.span * Math.max(1, 1.25 / this.camera.aspect);
    const targetZ = this.path.length === 0 ? 2 : this.path.length >= 3 ? 1 : 0;
    gsap.to(this.camera.position, {
      x: top ? 0.01 : d * 0.6,
      y: top ? d * 1.2 : d * 0.82,
      z: targetZ + (top ? 0.01 : d * 0.86),
      duration: 0.85,
      ease: 'power2.inOut',
    });
    gsap.to(this.controls.target, { x: 0, y: 0, z: targetZ, duration: 0.85, ease: 'power2.inOut' });
  }
  update(tick: number, selected: number) {
    this.tick = tick;
    this.selected = selected;
    if (!this.particles) return;
    for (let warp = 0; warp < 8; warp++) {
      const state = warpState(tick, warp),
        p = this.points[state.subpart];
      const key = state.event;
      if (this.routeKeys[warp] !== key) {
        const a = p[state.from],
          b = p[state.to];
        const intermediate =
          state.event === 'memory_return'
            ? [p.l2, p.l1]
            : state.event === 'cache_lookup'
              ? [p.l1]
              : [];
        const mid = a
          .clone()
          .lerp(b, 0.5)
          .add(v([0, 0.8, 0]));
        this.routes[warp] = new THREE.CatmullRomCurve3([
          a,
          ...(intermediate.length ? intermediate : [mid]),
          b,
        ]);
        this.routeKeys[warp] = key;
      }
      const pos = this.routes[warp].getPoint(state.progress);
      this.matrix.position.copy(pos);
      this.matrix.scale.setScalar(warp === selected ? 2 : 1);
      if (this.path.length === 4 && state.subpart !== this.path[3]) this.matrix.scale.setScalar(0);
      this.matrix.updateMatrix();
      this.particles.setMatrixAt(warp, this.matrix.matrix);
      this.particles.setColorAt(warp, new THREE.Color(state.color));
    }
    this.particles.instanceMatrix.needsUpdate = true;
    if (this.particles.instanceColor) this.particles.instanceColor.needsUpdate = true;
  }
  render() {
    if (!this.disposed) {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  }
  dispose() {
    this.disposed = true;
    this.observer.disconnect();
    this.clear();
    this.controls.dispose();
    this.surfaces.dispose();
    this.environment.dispose();
    this.renderer.dispose();
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);
    this.renderer.domElement.removeEventListener('pointerdown', this.pointerDown);
    this.renderer.domElement.removeEventListener('pointerup', this.pointerUp);
    this.renderer.domElement.removeEventListener('pointermove', this.pointerMove);
    this.renderer.domElement.removeEventListener('pointerleave', this.pointerLeave);
    this.tooltip.remove();
    this.renderer.domElement.remove();
  }
}
