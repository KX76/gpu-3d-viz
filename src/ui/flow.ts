import { SKUS } from '../model.ts';
import { warpState } from '../engine.ts';
import type { AppState } from '../app-state.ts';
import { element as $ } from './dom.ts';
export function renderFlowPanel(state: AppState) {
  const s = warpState(state.tick, state.warp);
  $('tick').textContent = Math.floor(state.tick).toString().padStart(3, '0');
  $<HTMLInputElement>('timeline').value = String(Math.floor(state.tick));
  $('warp-name').textContent = `WARP ${state.warp.toString().padStart(2, '0')}`;
  $('partition-name').textContent = `PARTITION ${s.subpart}`;
  $('event-name').textContent = s.name;
  $('event-name').style.color = s.color;
  $('event-explanation').textContent =
    s.explanation +
    (s.event === 'execute_tensor' && SKUS[state.sku].arch.tmem
      ? ' 此处是通用 mma 示意，不经过独立 TMEM 路径。'
      : '');
  $('flow-route').textContent =
    `${s.from === 'dram' ? SKUS[state.sku].memoryType : s.from.toUpperCase()} → ${s.to === 'dram' ? SKUS[state.sku].memoryType : s.to.toUpperCase()}`;
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-warp]')) {
    const w = Number(btn.dataset.warp),
      ws = warpState(state.tick, w);
    btn.classList.toggle('selected', w === state.warp);
    btn.setAttribute('aria-pressed', String(w === state.warp));
    btn.style.setProperty('--warp', ws.color);
    btn.disabled = state.path.length === 4 && w % 4 !== state.path[3];
  }
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-phase]'))
    btn.classList.toggle('current', Number(btn.dataset.phase) === s.start);
}
