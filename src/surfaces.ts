import * as THREE from 'three';

export type SurfaceKind = 'logic' | 'memory' | 'substrate' | 'hbm';

/** Procedural visual texture, not a reverse-engineered semiconductor mask. */
export class ChipSurfaces {
  private textures = new Map<string, THREE.CanvasTexture>();
  constructor(private anisotropy: number) {}
  texture(kind: SurfaceKind, disabled = false) {
    const key = `${kind}-${disabled}`;
    const cached = this.textures.get(key);
    if (cached) return cached;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    let seed = kind === 'logic' ? 815 : kind === 'memory' ? 923 : 481;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const palettes = disabled
      ? ['#343c3e', '#545756', '#252e32', '#6b6760']
      : kind === 'memory'
        ? ['#5c6455', '#aca280', '#434959', '#87858c']
        : ['#5b565c', '#989478', '#585e68', '#8b7471', '#738681', '#8f8499'];
    ctx.fillStyle = kind === 'substrate' ? '#16372e' : kind === 'hbm' ? '#23262b' : '#282c35';
    ctx.fillRect(0, 0, 1024, 1024);
    if (kind === 'logic' || kind === 'memory') {
      const cols = kind === 'memory' ? 12 : 4,
        rows = kind === 'memory' ? 4 : 8;
      const cw = 984 / cols,
        ch = 984 / rows;
      for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols; col++) {
          const x = 20 + col * cw,
            y = 20 + row * ch,
            w = cw - 12,
            h = ch - 10;
          ctx.fillStyle = palettes[Math.floor(random() * palettes.length)];
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = '#d8cfac';
          ctx.globalAlpha = 0.38;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
          ctx.globalAlpha = 1;
          // Dense SRAM-like banks and fine standard-cell rows at several scales.
          const bankW = (w - 12) / 3,
            bankH = (h - 10) / 2;
          for (let by = 0; by < 2; by++)
            for (let bx = 0; bx < 3; bx++) {
              const px = x + 6 + bx * bankW,
                py = y + 5 + by * bankH;
              ctx.fillStyle = palettes[Math.floor(random() * palettes.length)];
              ctx.fillRect(px, py, bankW - 3, bankH - 3);
              ctx.fillStyle = '#161f2c';
              for (let k = 3; k < bankH - 3; k += 3) ctx.fillRect(px + 2, py + k, bankW - 7, 0.8);
              ctx.fillStyle = '#ded0a7';
              ctx.globalAlpha = 0.5;
              for (let k = 5; k < bankW - 6; k += 9) ctx.fillRect(px + k, py + 2, 0.8, bankH - 6);
              ctx.globalAlpha = 1;
            }
          // Repeated metal vias along macro boundaries.
          ctx.fillStyle = '#cab995';
          for (let k = 3; k < w - 4; k += 7) ctx.fillRect(x + k, y + h - 3, 2, 1.5);
        }
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 150; i++) {
        const y = 8 + random() * 1008,
          start = random() * 160;
        ctx.strokeStyle = i % 3 === 0 ? '#c1bd9a' : '#b1b2bf';
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        ctx.moveTo(start, y);
        ctx.lineTo(400, y);
        ctx.lineTo(400 + 24, y + 24);
        ctx.lineTo(1000 - start, y + 24);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
      gradient.addColorStop(0, '#91707b24');
      gradient.addColorStop(0.42, '#74b5a925');
      gradient.addColorStop(1, '#7670a528');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);
    } else if (kind === 'substrate') {
      ctx.strokeStyle = '#548066';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 190; i++) {
        const x = random() * 1024,
          y = random() * 1024,
          dx = 20 + random() * 180;
        ctx.globalAlpha = 0.22 + random() * 0.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx, y);
        ctx.lineTo(x + dx + 30, y + 30);
        ctx.lineTo(x + dx + 30, y + 90);
        ctx.stroke();
        ctx.fillStyle = '#92a179';
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
      ctx.globalAlpha = 1;
    } else {
      for (let i = 0; i < 8000; i++) {
        ctx.fillStyle = `rgba(155,157,161,${random() * 0.12})`;
        ctx.fillRect(random() * 1024, random() * 1024, 1, 1);
      }
      ctx.fillStyle = '#a6afb0';
      ctx.font = '38px monospace';
      ctx.fillText('DRAM', 100, 220);
      ctx.font = '21px monospace';
      ctx.fillStyle = '#6d777f';
      ctx.fillText('MEMORY PACKAGE', 100, 270);
      ctx.fillText('SCHEMATIC PACKAGE', 100, 310);
      ctx.strokeStyle = '#41494f';
      ctx.strokeRect(28, 28, 968, 968);
      // Laser-etched illustrative matrix mark, with no fabricated manufacturer ID.
      for (let y = 0; y < 18; y++)
        for (let x = 0; x < 18; x++)
          if (random() > 0.5) {
            ctx.fillStyle = '#798586';
            ctx.fillRect(105 + x * 7, 700 + y * 7, 5, 5);
          }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.anisotropy;
    texture.userData.shared = true;
    this.textures.set(key, texture);
    return texture;
  }
  material(kind: SurfaceKind, disabled = false, tint = '#ffffff') {
    const silicon = kind === 'logic' || kind === 'memory';
    return new THREE.MeshPhysicalMaterial({
      color: tint,
      map: this.texture(kind, disabled),
      metalness: silicon ? 0.74 : kind === 'hbm' ? 0.38 : 0.22,
      roughness: silicon ? 0.31 : kind === 'hbm' ? 0.37 : 0.64,
      clearcoat: silicon ? 0.7 : 0.2,
      clearcoatRoughness: 0.24,
      iridescence: silicon && !disabled ? 0.32 : 0,
      iridescenceIOR: 1.4,
      iridescenceThicknessRange: [180, 380],
      envMapIntensity: silicon ? 1.05 : 0.65,
      emissive: '#9fbdaa',
      emissiveIntensity: 0,
    });
  }
  dispose() {
    for (const texture of this.textures.values()) texture.dispose();
    this.textures.clear();
  }
}
