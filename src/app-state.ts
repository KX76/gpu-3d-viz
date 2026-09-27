import type { Path, SkuId } from './model.ts';
export const createState = () => ({
  sku: 'a800' as SkuId,
  path: [] as Path,
  playing: true,
  tick: 0,
  speed: 1,
  explode: 0,
  warp: 0,
  annotated: false,
});
export type AppState = ReturnType<typeof createState>;
