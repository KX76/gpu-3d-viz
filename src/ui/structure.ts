import { description, nodeStats, sceneSubtitle } from './details.ts';
import {
  SKUS,
  LEVELS,
  childCount,
  childLabel,
  isEnabled,
  nodeTitle,
  smId,
  type Path,
} from '../model.ts';
import type { AppState } from '../app-state.ts';
import { element as $ } from './dom.ts';
export function renderStructurePanel(state: AppState, navigate: (path: Path) => void) {
  const sku = SKUS[state.sku],
    path = state.path,
    l = path.length;
  $('sku-subtitle').textContent = sku.subtitle;
  $('footer-config').textContent = `${sku.smCount} SM / ${sku.smCount * sku.arch.fp32} FP32 cores`;
  $('footer-arch').textContent = `/ ${sku.arch.name.toUpperCase()}`;
  $<HTMLSelectElement>('sku').value = sku.id;
  $<HTMLSelectElement>('focus-sku').value = sku.id;
  $('sku-sources').innerHTML =
    `<h3>${sku.name}</h3><p>${sku.subtitle} · ${sku.memory}</p><p>${sku.note || '核心数量按具体产品规格；空间排布用于层级教学。'}</p><a href="${sku.source}" target="_blank" rel="noopener">型号规格 / 公开记录 ↗</a><a href="${sku.arch.source}" target="_blank" rel="noopener">NVIDIA · ${sku.arch.name} 架构资料 ↗</a>${sku.id === 'b200' ? '<a href="https://developer.nvidia.com/blog/scaling-autonomous-ai-agents-and-workloads-with-nvidia-dgx-spark/" target="_blank" rel="noopener">NVIDIA · B200 148 SM 说明 ↗</a>' : ''}`;
  $('scene-title').textContent = l ? nodeTitle(path) : sku.name;
  $('detail-title').textContent = l ? nodeTitle(path) : sku.chip;
  $('description').textContent = description(sku, path);
  $('level-eyebrow').textContent = `LEVEL 0${l + 1} / ${LEVELS[l].toUpperCase()}`;
  $('scene-subtitle').textContent = sceneSubtitle(sku, l);
  $('hierarchy').innerHTML = LEVELS.map(
    (name, i) =>
      `<button class="level ${i === l ? 'active' : ''}" data-level="${i}" ${i > l ? 'disabled' : ''}><span class="level-icon">${['▧', '▦', '▤', '▣', '⊞'][i]}</span><span>${name}</span><span class="level-id">${i === 0 ? sku.chip : i <= l ? String(path[i - 1]).padStart(2, '0') : '—'}</span></button>`,
  ).join('');
  $('breadcrumb').innerHTML = Array.from(
    { length: l + 1 },
    (_, i) =>
      `<button data-level="${i}">${i === 0 ? sku.chip : `${LEVELS[i]} ${path[i - 1]}`}</button>${i < l ? '<span>/</span>' : ''}`,
  ).join('');
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-level]'))
    btn.onclick = () => navigate(path.slice(0, Number(btn.dataset.level)));
  $('children-label').textContent =
    l < 4 ? `${LEVELS[l + 1]} ${l < 2 ? '分组 · 示意' : '单元'}` : '执行单元';
  const n = childCount(sku, path);
  $('children-count').textContent =
    l < 4
      ? `${Array.from({ length: n }, (_, i) => isEnabled(sku, [...path, i])).filter(Boolean).length} 启用`
      : '';
  $('children').innerHTML =
    l < 4
      ? Array.from(
          { length: n },
          (_, i) =>
            `<button data-child="${i}" ${isEnabled(sku, [...path, i]) ? '' : 'disabled'}>${childLabel(path, i)} <span>${isEnabled(sku, [...path, i]) ? '↗' : '关闭'}</span></button>`,
        ).join('')
      : '<p class="muted small">Scheduler · Register File · FP32 / INT32 · Tensor · FP64 · LD/ST / SFU</p>';
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-child]'))
    btn.onclick = () => navigate([...path, Number(btn.dataset.child)]);
  const stats = nodeStats(sku, path);
  $('stats').innerHTML = stats
    .map(([value, label]) => `<div><b>${value}</b><span>${label}</span></div>`)
    .join('');
  $('trace-sm').textContent = `布局 SM ${smId(sku, path)}`;
}
