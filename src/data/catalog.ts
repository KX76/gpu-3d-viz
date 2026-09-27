export type SkuId = 'a800' | '4090d' | 'pro5000' | '5090' | 'pro6000' | 'b200' | 'a100' | 'ga100';
export interface Architecture {
  name: string;
  cc: string;
  fp32: number;
  tensorGen: number;
  l1: number;
  alu: string;
  extra: string;
  rt: number;
  tmem: boolean;
  source: string;
}
const ampere: Architecture = {
  name: 'Ampere',
  cc: '8.0',
  fp32: 64,
  tensorGen: 3,
  l1: 192,
  alu: '16 FP32 + 16 INT32',
  extra: '8 FP64',
  rt: 0,
  tmem: false,
  source: 'https://developer.nvidia.com/blog/nvidia-ampere-architecture-in-depth/',
};
export const ada: Architecture = {
  name: 'Ada',
  cc: '8.9',
  fp32: 128,
  tensorGen: 4,
  l1: 128,
  alu: '16 FP32 + 16 FP/INT',
  extra: 'FP64 · SM SHARED',
  rt: 3,
  tmem: false,
  source: 'https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf',
};
export const rtx: Architecture = {
  name: 'Blackwell RTX',
  cc: '12.0',
  fp32: 128,
  tensorGen: 5,
  l1: 128,
  alu: '32 FP32 / INT32',
  extra: 'FP64 · SM SHARED',
  rt: 4,
  tmem: false,
  source:
    'https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf',
};
const blackwell: Architecture = {
  name: 'Blackwell DC',
  cc: '10.0',
  fp32: 128,
  tensorGen: 5,
  l1: 256,
  alu: '32 FP32 · INT32',
  extra: 'FP64',
  rt: 0,
  tmem: true,
  source: 'https://docs.nvidia.com/cuda/blackwell-tuning-guide/',
};
export interface Sku {
  id: SkuId;
  name: string;
  chip: string;
  arch: Architecture;
  featured: boolean;
  subtitle: string;
  tpcs: number[];
  maxTpcs: number;
  smCount: number;
  hbmStacks: number;
  memory: string;
  memoryType: string;
  l2: string;
  package: 'hbm' | 'gddr' | 'dual-hbm';
  memoryPackages: number;
  source: string;
  note: string;
}
type Spec = Omit<Sku, 'subtitle' | 'featured' | 'note'> & Partial<Pick<Sku, 'featured' | 'note'>>;
const sku = (s: Spec): Sku => ({
  featured: true,
  note: '',
  ...s,
  subtitle: `${s.arch.name} / ${s.chip} · SM ${s.arch.cc}`,
});
const ampereSource = 'https://developer.nvidia.com/blog/nvidia-ampere-architecture-in-depth/';
export const SKUS: Record<SkuId, Sku> = {
  a800: sku({
    id: 'a800',
    name: 'A800 SXM4 · 80 GB',
    chip: 'GA100',
    arch: ampere,
    tpcs: [8, 8, 8, 8, 8, 7, 7, 0],
    maxTpcs: 8,
    smCount: 108,
    hbmStacks: 5,
    memory: '80 GB HBM2e',
    memoryType: 'HBM2e',
    l2: '40 MB',
    package: 'hbm',
    memoryPackages: 5,
    source: 'https://forums.developer.nvidia.com/t/l2cache-size-of-a800-80gb/289934',
    note: '108 SM / 6912 CUDA 核心与公开 deviceQuery 记录交叉核对。启用位置为示意。',
  }),
  '4090d': sku({
    id: '4090d',
    name: 'RTX 4090 D · 24 GB',
    chip: 'AD102',
    arch: ada,
    tpcs: [6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 0, 0],
    maxTpcs: 6,
    smCount: 114,
    hbmStacks: 0,
    memory: '24 GB GDDR6X',
    memoryType: 'GDDR6X',
    l2: '未核验',
    package: 'gddr',
    memoryPackages: 12,
    source: 'https://www.nvidia.cn/geforce/graphics-cards/40-series/rtx-4090-d/',
  }),
  pro5000: sku({
    id: 'pro5000',
    name: 'RTX PRO 5000 · 72 GB',
    chip: 'Blackwell',
    arch: rtx,
    tpcs: [8, 8, 8, 8, 8, 8, 7, 0, 0, 0, 0, 0],
    maxTpcs: 8,
    smCount: 110,
    hbmStacks: 0,
    memory: '72 GB GDDR7 ECC',
    memoryType: 'GDDR7',
    l2: '未核验',
    package: 'gddr',
    memoryPackages: 12,
    source:
      'https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-5000/',
    note: '此处为 72 GB 版。GPC 分组借用 Blackwell RTX 完整结构作导航示意，非该 SKU 的实测熔丝图；显存颗粒为正面示意，不据此推断颗粒容量。',
  }),
  '5090': sku({
    id: '5090',
    name: 'RTX 5090 · 32 GB',
    chip: 'GB202',
    arch: rtx,
    tpcs: [8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 0],
    maxTpcs: 8,
    smCount: 170,
    hbmStacks: 0,
    memory: '32 GB GDDR7',
    memoryType: 'GDDR7',
    l2: '96 MB',
    package: 'gddr',
    memoryPackages: 16,
    source: 'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/',
  }),
  pro6000: sku({
    id: 'pro6000',
    name: 'RTX PRO 6000 Server · 96 GB',
    chip: 'GB202',
    arch: rtx,
    tpcs: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 7, 7],
    maxTpcs: 8,
    smCount: 188,
    hbmStacks: 0,
    memory: '96 GB GDDR7 ECC',
    memoryType: 'GDDR7',
    l2: '未核验',
    package: 'gddr',
    memoryPackages: 16,
    source: 'https://www.nvidia.com/en-us/data-center/rtx-pro-6000-blackwell-server-edition/',
    note: 'Server Edition。PCB、正面显存与供电元件为示意，不表示实际板卡布线或背面颗粒分布。',
  }),
  b200: sku({
    id: 'b200',
    name: 'B200 · 180 GB',
    chip: '双 Die',
    arch: blackwell,
    tpcs: [10, 9, 9, 9, 10, 9, 9, 9],
    maxTpcs: 10,
    smCount: 148,
    hbmStacks: 8,
    memory: '180 GB HBM3e',
    memoryType: 'HBM3e',
    l2: '未核验',
    package: 'dual-hbm',
    memoryPackages: 8,
    source: 'https://docs.nvidia.com/dgx/dgxb200-user-guide/introduction-to-dgxb200.html',
    note: '双 Die / 8 HBM 堆栈；GPC 与 TPC 分组为导航示意。公开 DGX B200 配置按每 GPU 180 GB。',
  }),
  a100: sku({
    id: 'a100',
    name: 'A100 · 40 GB',
    chip: 'GA100',
    arch: ampere,
    featured: false,
    tpcs: [8, 8, 8, 8, 8, 7, 7, 0],
    maxTpcs: 8,
    smCount: 108,
    hbmStacks: 5,
    memory: '40 GB HBM2',
    memoryType: 'HBM2',
    l2: '40 MB',
    package: 'hbm',
    memoryPackages: 5,
    source: ampereSource,
  }),
  ga100: sku({
    id: 'ga100',
    name: 'GA100 · 完整芯片',
    chip: 'GA100',
    arch: ampere,
    featured: false,
    tpcs: [8, 8, 8, 8, 8, 8, 8, 8],
    maxTpcs: 8,
    smCount: 128,
    hbmStacks: 6,
    memory: '6 × HBM 接口',
    memoryType: 'HBM',
    l2: '完整配置示意',
    package: 'hbm',
    memoryPackages: 6,
    source: ampereSource,
  }),
};
