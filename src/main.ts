import { createState } from './app-state.ts';
import { shellHtml } from './ui/shell.ts';
import { element as $ } from './ui/dom.ts';
import { renderStructurePanel } from './ui/structure.ts';
import { renderFlowPanel } from './ui/flow.ts';
import './style.css';
import { GpuScene } from './scene.ts';
import { SKUS, isEnabled, smId, type Path, type SkuId } from './model.ts';
import { DURATION, toJSONL } from './engine.ts';
const state = createState();
document.querySelector('#app')!.innerHTML = shellHtml();
let scene: GpuScene | undefined;
try {
  scene = new GpuScene($('viewport'), (path) => navigate(path));
} catch (error) {
  $('viewport').innerHTML =
    '<div class="webgl-error"><h2>无法启动 3D 视图</h2><p>请使用支持 WebGL 2 的浏览器，并开启图形加速。侧栏与事件流仍可使用。</p></div>';
  console.error(error);
}
function navigate(path: Path) {
  if (!isEnabled(SKUS[state.sku], path)) return;
  state.path = path;
  if (path.length) setVisual(true);
  if (path.length === 4 && state.warp % 4 !== path[3]) state.warp = path[3];
  renderStructure();
}
function renderStructure() {
  renderStructurePanel(state, navigate);
  scene?.build(SKUS[state.sku], state.path, state.explode);
  scene?.setAnnotations(state.annotated);
  renderFlow();
}
function renderFlow() {
  renderFlowPanel(state);
  scene?.update(state.tick, state.warp);
}
function playback(playing: boolean) {
  state.playing = playing;
  $('play').textContent = playing ? 'Ⅱ' : '▶';
  $('play').setAttribute('aria-label', playing ? '暂停' : '播放');
}
$('play').onclick = () => playback(!state.playing);
$('step').onclick = () => {
  playback(false);
  state.tick = (Math.floor(state.tick) + 1) % DURATION;
  renderFlow();
};
$('restart').onclick = () => {
  state.tick = 0;
  renderFlow();
};
$<HTMLInputElement>('timeline').oninput = (e) => {
  playback(false);
  state.tick = Number((e.target as HTMLInputElement).value);
  renderFlow();
};
$<HTMLSelectElement>('speed').onchange = (e) =>
  (state.speed = Number((e.target as HTMLSelectElement).value));
for (const id of ['sku', 'focus-sku'])
  $<HTMLSelectElement>(id).onchange = (e) => {
    state.sku = (e.target as HTMLSelectElement).value as SkuId;
    state.path = [];
    state.tick = 0;
    renderStructure();
  };
$<HTMLInputElement>('explode').oninput = (e) => {
  state.explode = Number((e.target as HTMLInputElement).value) / 100;
  $('explode-value').textContent = `${Math.round(state.explode * 100)}%`;
  scene?.build(SKUS[state.sku], state.path, state.explode, false);
};
for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-warp]'))
  btn.onclick = () => {
    state.warp = Number(btn.dataset.warp);
    renderFlow();
  };
for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-phase]'))
  btn.onclick = () => {
    playback(false);
    state.tick = (Number(btn.dataset.phase) + state.warp * 23) % DURATION;
    renderFlow();
  };
function setVisual(annotated: boolean) {
  state.annotated = annotated;
  scene?.setAnnotations(annotated);
  document.querySelector('.viewport-wrap')!.classList.toggle('surface-mode', !annotated);
  for (const [id, selected] of [
    ['surface-view', !annotated],
    ['annotation-view', annotated],
  ] as const) {
    $(id).classList.toggle('selected', selected);
    $(id).setAttribute('aria-pressed', String(selected));
  }
}
$('surface-view').onclick = () => setVisual(false);
$('annotation-view').onclick = () => setVisual(true);
$('focus-view').onclick = () => {
  const expanded = document.body.classList.toggle('focus-view');
  $('focus-view').setAttribute('aria-label', expanded ? '收起画布' : '展开画布');
  $('focus-view').title = expanded ? '收起画布' : '展开画布';
};
setVisual(false);
$('reset-camera').onclick = () => scene?.resetCamera();
$('top-view').onclick = () => scene?.resetCamera(true);
$('sources').onclick = () => $<HTMLDialogElement>('sources-dialog').showModal();
$('close-dialog').onclick = () => $<HTMLDialogElement>('sources-dialog').close();
$('export').onclick = () => {
  const blob = new Blob([toJSONL(smId(SKUS[state.sku], state.path), SKUS[state.sku])], {
      type: 'application/x-ndjson',
    }),
    url = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.href = url;
  link.download = `gpu-atlas-${state.sku}-sm${smId(SKUS[state.sku], state.path)}-schematic.jsonl`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
document.addEventListener('keydown', (e) => {
  if (
    e.code === 'Space' &&
    !['INPUT', 'SELECT', 'BUTTON'].includes((e.target as HTMLElement).tagName) &&
    !$<HTMLDialogElement>('sources-dialog').open
  ) {
    e.preventDefault();
    playback(!state.playing);
  }
});
renderStructure();
let previous = performance.now(),
  lastUI = 0,
  frame = 0;
function animate(now: number) {
  const dt = Math.min((now - previous) / 1000, 0.1);
  previous = now;
  if (state.playing && !document.hidden)
    state.tick = (state.tick + dt * 18 * state.speed) % DURATION;
  scene?.update(state.tick, state.warp);
  scene?.render();
  if (now - lastUI > 80) {
    renderFlow();
    lastUI = now;
  }
  frame = requestAnimationFrame(animate);
}
frame = requestAnimationFrame(animate);
window.addEventListener(
  'pagehide',
  () => {
    cancelAnimationFrame(frame);
    scene?.dispose();
  },
  { once: true },
);
