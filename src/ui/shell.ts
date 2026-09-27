import { SKUS, COLORS, type SkuId } from '../model.ts';
import { STAGES } from '../engine.ts';
export function shellHtml() {
  const skuOrder: SkuId[] = [
    'a800',
    '4090d',
    'pro5000',
    '5090',
    'pro6000',
    'b200',
    'a100',
    'ga100',
  ];
  const skuOptions = () =>
    [true, false]
      .map(
        (featured) =>
          `<optgroup label="${featured ? 'GPU 型号' : '参考配置'}">${skuOrder
            .filter((id) => SKUS[id].featured === featured)
            .map((id) => `<option value="${id}">${SKUS[id].name}</option>`)
            .join('')}</optgroup>`,
      )
      .join('');
  return /* HTML */ `
    <header class="header">
      <a class="brand" href=""
        ><span class="brand-symbol">▧</span> GPU <strong>ATLAS</strong
        ><span class="edition">/ 01</span></a
      >
      <div class="header-title">架构实验室 <span>从芯片，到一条指令。</span></div>
      <button id="sources" class="quiet">资料与边界 <span>↗</span></button>
    </header>
    <div class="workspace">
      <aside class="sidebar">
        <div class="eyebrow">ARCHITECTURE EXPLORER</div>
        <h1>走进 GPU<span>看见并行计算</span></h1>
        <label class="field-label" for="sku">芯片配置</label>
        <select id="sku">
          ${skuOptions()}
        </select>
        <div id="sku-subtitle" class="muted small"></div>
        <div class="divider"></div>
        <div class="section-label">
          <span>01 / 架构层级</span><span class="muted">点击探索</span>
        </div>
        <nav id="hierarchy" aria-label="架构层级"></nav>
        <div class="section-label child-heading">
          <span id="children-label">GPC 集群</span><span id="children-count"></span>
        </div>
        <div id="children" class="children"></div>
        <div class="sidebar-bottom">
          <span class="status-dot"></span> 6 型号 · 架构实验室
          <p>结构参数有据可查<br />空间布局与时间均为教学示意</p>
        </div>
      </aside>
      <main class="main">
        <div class="scene-toolbar">
          <select id="focus-sku" aria-label="画布芯片配置">
            ${skuOptions()}
          </select>
          <nav id="breadcrumb" aria-label="当前位置"></nav>
          <div class="view-switch" aria-label="显示方式">
            <button id="surface-view" class="selected" aria-pressed="true">芯片表面</button
            ><button id="annotation-view" aria-pressed="false">架构标注</button>
          </div>
        </div>
        <section class="viewport-wrap" aria-label="三维架构视图">
          <div class="scene-heading">
            <div class="eyebrow" id="level-eyebrow">LEVEL 01 / DIE</div>
            <h2 id="scene-title">GPU Die</h2>
            <p id="scene-subtitle"></p>
          </div>
          <div id="viewport"></div>
          <div class="camera-tools">
            <button id="reset-camera" title="重置视角" aria-label="重置视角">⌂</button
            ><button id="top-view" title="俯视" aria-label="俯视">⊞</button
            ><button id="focus-view" title="展开画布" aria-label="展开画布">⛶</button>
          </div>
          <div class="surface-note">SILICON SURFACE <span>/ 材质与电路纹理为示意复原</span></div>
          <div class="scene-caption">
            <span>↔ 拖动旋转</span><span>↕ 滚轮缩放</span><span>⊙ 点击下钻</span>
          </div>
          <div class="legend">
            <span style="--dot:${COLORS.compute}">执行</span
            ><span style="--dot:${COLORS.memory}">访存</span
            ><span style="--dot:${COLORS.stall}">等待依赖</span
            ><span style="--dot:${COLORS.returned}">返回</span>
          </div>
        </section>
        <section class="timeline-panel" aria-label="示意时间轴">
          <div class="timeline-top">
            <div>
              <span class="eyebrow">INSTRUCTION FLOW</span
              ><span class="trace-label">8 个示例 warp · <b id="trace-sm">SM 0</b></span>
            </div>
            <button id="export" class="quiet">导出 JSONL ↓</button>
          </div>
          <div class="phase-strip">
            ${STAGES.map(
              (s) =>
                `<button data-phase="${s.start}" title="跳到${s.name}" style="flex:${s.end - s.start};--phase:${s.color}">${s.name}</button>`,
            ).join('')}
          </div>
          <input
            id="timeline"
            type="range"
            min="0"
            max="239"
            step="1"
            value="0"
            aria-label="示意时间位置"
          />
          <div class="playback">
            <div class="play-buttons">
              <button id="restart" aria-label="从头播放" title="从头播放">↶</button
              ><button id="play" class="play" aria-label="暂停">Ⅱ</button
              ><button id="step" aria-label="单步一个 tick" title="单步一个 tick">▸│</button
              ><span class="clock"><b id="tick">000</b><span> / 240 ticks</span></span>
            </div>
            <label class="speed-label"
              >速度
              <select id="speed" aria-label="播放速度">
                <option value="0.25">0.25×</option>
                <option value="1" selected>1×</option>
                <option value="4">4×</option>
                <option value="16">16×</option>
                <option value="100">100×</option>
              </select></label
            ><span class="timing-note">压缩时间示意 · 非硬件周期</span>
          </div>
        </section>
      </main>
      <aside class="inspector">
        <div class="section-label"><span>02 / 当前单元</span><span class="live-mark">●</span></div>
        <h2 id="detail-title"></h2>
        <p id="description" class="description"></p>
        <div id="stats" class="stats"></div>
        <div class="divider"></div>
        <label class="section-label" for="explode"
          ><span>结构展开</span><output id="explode-value">0%</output></label
        ><input id="explode" type="range" min="0" max="100" value="0" />
        <div class="range-labels"><span>紧凑</span><span>分离层级</span></div>
        <div class="divider"></div>
        <div class="section-label">
          <span>03 / WARP 追踪</span><span class="muted">32 线程 / warp</span>
        </div>
        <div id="warps" class="warps">
          ${Array.from(
            { length: 8 },
            (_, i) =>
              `<button data-warp="${i}" aria-label="追踪 warp ${i}">${i.toString().padStart(2, '0')}</button>`,
          ).join('')}
        </div>
        <div class="flow-card">
          <div class="flow-meta"><span id="warp-name"></span><span id="partition-name"></span></div>
          <h3 id="event-name"></h3>
          <p id="event-explanation"></p>
          <div class="flow-route" id="flow-route"></div>
        </div>
        <p class="disclaimer">动画展示一组固定的教学指令。尚未接入真机采样或周期精确模拟。</p>
      </aside>
    </div>
    <footer class="footer">
      <span>GPU ATLAS <span class="muted" id="footer-arch"></span></span
      ><span
        >Three.js · 本地运行 <span class="footer-dot">•</span> <span id="footer-config"></span
      ></span>
    </footer>
    <dialog id="sources-dialog">
      <div class="dialog-head">
        <h2>资料与模型边界</h2>
        <button id="close-dialog" aria-label="关闭">×</button>
      </div>
      <div id="sku-sources"></div>
      <ul>
        <li>
          FP32 核心数采用公开产品规格，SM 数按架构每 SM 的核心数换算；B200 采用公开的 148 SM 配置。
        </li>
        <li>
          GPC / TPC 分组、禁用位置及 SM ID 均为教学布局，不是 SKU
          实测熔丝图。显存颗粒数量与位置不用于推断单颗容量或实际 PCB 布线。
        </li>
        <li>
          电路纹理、金属反射和封装细节是程序生成的视觉复原，不是显微实拍或制造版图；PCB
          视图省略散热器。
        </li>
        <li>
          指令序列、访存未命中与时间均为教学示意。B200 动画采用通用 mma 路径，不模拟 tcgen05 / TMEM
          指令时序。RT Core 不参与本组示例指令。
        </li>
        <li>JSONL 包含当前型号、架构和显存类型；cycle 单位为 teaching-tick，不能用于性能预测。</li>
      </ul>
    </dialog>
  `;
}
