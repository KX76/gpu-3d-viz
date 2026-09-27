import { COLORS, type Sku } from './model.ts';
export const DURATION = 240;
export type Endpoint = 'scheduler' | 'register' | 'fp32' | 'tensor' | 'ldst' | 'l1' | 'l2' | 'dram';
export interface Stage {
  start: number;
  end: number;
  name: string;
  event: string;
  from: Endpoint;
  to: Endpoint;
  color: string;
  explanation: string;
}
// Deliberately compressed teaching timing. These are not measured GPU cycles.
export const STAGES: Stage[] = [
  {
    start: 0,
    end: 16,
    name: '发射访存',
    event: 'issue_load',
    from: 'scheduler',
    to: 'ldst',
    color: COLORS.compute,
    explanation: '调度器选择一个可发射的 warp，向 LD/ST 单元发射访存指令。',
  },
  {
    start: 16,
    end: 40,
    name: '查询缓存',
    event: 'cache_lookup',
    from: 'ldst',
    to: 'l2',
    color: COLORS.memory,
    explanation: '本示例设定 L1 与 L2 均未命中，请求继续访问显存。命中率并非真机数据。',
  },
  {
    start: 40,
    end: 72,
    name: '访问显存',
    event: 'memory_request',
    from: 'l2',
    to: 'dram',
    color: COLORS.memory,
    explanation: 'L2 未命中的访问交给显存控制器，随后访问片外显存。',
  },
  {
    start: 72,
    end: 96,
    name: '等待依赖',
    event: 'scoreboard_wait',
    from: 'scheduler',
    to: 'scheduler',
    color: COLORS.stall,
    explanation:
      '示意 scoreboard 等待：后续指令依赖尚未返回的数据。其他就绪 warp 可以获得执行机会。',
  },
  {
    start: 96,
    end: 128,
    name: '数据返回',
    event: 'memory_return',
    from: 'dram',
    to: 'register',
    color: COLORS.returned,
    explanation: '数据经缓存层次返回寄存器，相关依赖解除，warp 可以继续执行。',
  },
  {
    start: 128,
    end: 172,
    name: 'FP32 运算',
    event: 'execute_fp32',
    from: 'register',
    to: 'fp32',
    color: COLORS.compute,
    explanation:
      'warp 的 32 个线程执行同一条指令。不同架构具有不同的执行数据通路，线程并非总能在一个周期全部执行。',
  },
  {
    start: 172,
    end: 208,
    name: '矩阵运算',
    event: 'execute_tensor',
    from: 'register',
    to: 'tensor',
    color: COLORS.tensor,
    explanation:
      '示意程序还包含矩阵指令，由 Tensor Core 执行。Tensor Core 不是所有标量指令的必经路径。',
  },
  {
    start: 208,
    end: 240,
    name: '结果写回',
    event: 'writeback',
    from: 'tensor',
    to: 'register',
    color: COLORS.returned,
    explanation: '结果写回寄存器。本轮示意结束；重新播放会回到相同的初始状态。',
  },
];
export function warpState(tick: number, warp: number) {
  const phase = (((tick - warp * 23) % DURATION) + DURATION) % DURATION;
  const stage = STAGES.find((s) => phase >= s.start && phase < s.end)!;
  return {
    ...stage,
    phase,
    progress: (phase - stage.start) / (stage.end - stage.start),
    subpart: warp % 4,
  };
}
export interface TeachingEvent {
  schema: 'gpu-viz/1';
  source: 'schematic';
  timeUnit: 'teaching-tick';
  cycle: number;
  sm: number;
  subpart: number;
  warp: number;
  event: string;
  from: Endpoint;
  to: Endpoint;
}
export function eventsForLoop(sm: number): TeachingEvent[] {
  return Array.from({ length: 8 }, (_, warp) =>
    STAGES.map((stage) => ({
      schema: 'gpu-viz/1' as const,
      source: 'schematic' as const,
      timeUnit: 'teaching-tick' as const,
      cycle: (stage.start + warp * 23) % DURATION,
      sm,
      subpart: warp % 4,
      warp,
      event: stage.event,
      from: stage.from,
      to: stage.to,
    })),
  )
    .flat()
    .sort((a, b) => a.cycle - b.cycle || a.warp - b.warp);
}
export function toJSONL(sm: number, sku?: Sku): string {
  return (
    eventsForLoop(sm)
      .map((e) =>
        JSON.stringify({
          ...e,
          ...(sku
            ? {
                sku: sku.id,
                architecture: sku.arch.name,
                computeCapability: sku.arch.cc,
                memoryType: sku.memoryType,
                smIdKind: 'schematic-layout',
              }
            : {}),
        }),
      )
      .join('\n') + '\n'
  );
}
