import { type Sku } from './data/catalog.ts';
export { SKUS, type Sku, type SkuId } from './data/catalog.ts';
export type Path = number[];
export const LEVELS = ['Die', 'GPC', 'TPC', 'SM', 'Sub-partition'];
export const COLORS = {
  compute: '#b6ed79',
  memory: '#f9b86e',
  returned: '#74c9ff',
  stall: '#f58083',
  idle: '#66818c',
  tensor: '#c4afff',
};
export function childCount(sku: Sku, path: Path): number {
  return [sku.tpcs.length, sku.maxTpcs, 2, 4, 0][path.length] ?? 0;
}
export function isEnabled(sku: Sku, path: Path): boolean {
  if (path.length > 4 || path.some((n) => !Number.isInteger(n) || n < 0)) return false;
  return (
    path.every((n, i) => n < childCount(sku, path.slice(0, i))) &&
    (!path.length || sku.tpcs[path[0]] > 0) &&
    (path.length < 2 || path[1] < sku.tpcs[path[0]])
  );
}
export function smId(sku: Sku, path: Path): number {
  return (path[0] ?? 0) * sku.maxTpcs * 2 + (path[1] ?? 0) * 2 + (path[2] ?? 0);
}
export function nodeTitle(path: Path): string {
  return path.length ? `${LEVELS[path.length]} ${path.at(-1)}` : 'GPU Package';
}
export function childLabel(path: Path, index: number): string {
  return `${LEVELS[path.length + 1]} ${index}`;
}
