import type { Sku, Path } from '../model.ts';
import { ada, rtx } from '../data/catalog.ts';
export function description(sku: Sku, path: Path): string {
  return [
    `${sku.name} · ${sku.package === 'dual-hbm' ? '双 Die 与 HBM3e 封装' : sku.package === 'gddr' ? 'GPU 芯片与板上 GDDR 显存' : 'GPU 芯片与封装内 HBM'}。启用单元数量按型号，空间位置为示意。`,
    `此导航分组最多展示 ${sku.maxTpcs} 个 TPC，每个 TPC 包含两个 SM；分组与禁用位置不是实测版图。`,
    '一个 TPC 包含两个 SM。线程块驻留在 SM 上，warp 由 SM 内的调度器选择发射。',
    `${sku.arch.name} SM：${sku.arch.fp32} FP32 核心、4 个第 ${sku.arch.tensorGen} 代 Tensor Core，${sku.arch.l1} KB L1 / Shared。${sku.arch.rt ? `另有一个第 ${sku.arch.rt} 代 RT Core。` : ''}${sku.arch.tmem ? '包含独立 Tensor Memory；本动画仅演示通用 mma 路径，不模拟 tcgen05。' : ''}`,
    `每个 warp 含 32 个线程。${sku.arch === rtx ? 'FP32 与 INT32 共用执行数据通路，不能把两者相加。' : sku.arch === ada ? '部分 FP32 与 INT32 共用执行数据通路。' : '执行单元数量不等于 warp 宽度。'}`,
  ][path.length];
}

/** Values are per selected node; ALU capacities are not added together. */
export function nodeStats(sku: Sku, path: Path): [string, string][] {
  switch (path.length) {
    case 0:
      return [
        [String(sku.smCount), '启用 SM'],
        [String(sku.smCount * sku.arch.fp32), 'FP32 cores'],
        [sku.memory, '显存'],
        [sku.l2, 'L2 cache'],
      ];
    case 1:
      return [
        [String(sku.tpcs[path[0]]), '启用 TPC'],
        [String(sku.tpcs[path[0]] * 2), 'SM'],
      ];
    case 2:
      return [
        ['2', 'SM'],
        ['8', '处理分区'],
      ];
    case 3:
      return [
        ['4', '处理分区'],
        [String(sku.arch.fp32), 'FP32 cores'],
        ['4', `第 ${sku.arch.tensorGen} 代 Tensor`],
        [`${sku.arch.l1} KB`, 'L1 / Shared'],
      ];
    case 4:
      return [
        ['1', '调度器'],
        [String(sku.arch.fp32 / 4), 'FP32 通路容量'],
        ['1', `第 ${sku.arch.tensorGen} 代 Tensor`],
        [sku.arch.alu, 'ALU 组织'],
      ];
    default:
      return [];
  }
}
export function sceneSubtitle(sku: Sku, depth: number): string {
  if (depth === 0) {
    if (sku.package === 'dual-hbm') return '双 Die、NV-HBI 与八组 HBM3e。';
    if (sku.package === 'gddr') return `硅片与板上 ${sku.memoryType}。省略散热器的 PCB 示意。`;
    return `硅片、${sku.memoryType} 与封装基板。`;
  }
  if (depth < 3) return '点击计算单元，继续向内探索。';
  if (depth === 3) return '四个处理分区，共享一个存储层次。';
  return '从调度到执行，跟随一个 warp 的旅程。';
}
