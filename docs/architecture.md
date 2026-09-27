# 架构与维护

## 数据如何到达画面

```text
catalog.ts ──→ model.ts ──→ ui/structure.ts
                     └──→ render/ 的层级构建
engine.ts  ──────────────→ ui/flow.ts + scene.ts 中的粒子
main.ts    ──→ AppState ──→ UI 更新 + scene.build / update
```

`main.ts` 负责连接状态、DOM 和场景。型号或层级变化时重建几何；播放时只更新粒子变换，文字界面约每 80 ms 更新一次。纯型号/时序规则不访问 DOM 或 WebGL。

`scene.ts` 管理相机、拾取、动画与清理。`render/geometry.ts` 提供 box、surface、label 等绘制操作；`packages.ts` 构建封装与 PCB；`hierarchy.ts` 构建 GPC 到处理分区。构建函数返回四个处理分区的事件端点，粒子据此插值移动。

`surfaces.ts` 缓存程序生成的纹理。场景重建时清理几何体、材质和非共享贴图；共享贴图只在整个场景销毁时释放。新增对象时应沿用这个所有权规则，避免重复释放或泄漏。

## 新增型号

1. 在 `data/catalog.ts` 中增加 `SkuId` 和 SKU；相同架构复用架构参数，保留型号来源链接。
2. `tpcs` 是每个示意 GPC 的启用 TPC 数，`maxTpcs` 是导航槽位上限。启用 SM 总数应为 `sum(tpcs) * 2`。
3. 在 `ui/shell.ts` 的显示顺序中加入型号；`featured` 控制主型号/参考配置分组。
4. 选择 `hbm`、`gddr` 或 `dual-hbm` 封装。新封装应在 `render/` 中增加独立构建函数，并由场景选择。
5. 补充测试中的型号规格、来源说明，运行 `pnpm check`，再检查切换和最末一个启用分区的下钻。

导航路径为 `[gpc, tpc, sm, subpartition]` 的前缀。SM ID 是包含禁用槽位的布局编号，不是设备硬件 ID，也不保证连续。

## 修改动画或展示

- 时序和事件端点：修改 `engine.ts`，确保每个分区都提供对应端点。
- 静态界面：修改 `ui/shell.ts`；动态详情和统计在 `ui/details.ts`、`ui/structure.ts`。
- 封装外观：修改 `render/packages.ts`；内部单元在 `render/hierarchy.ts`。
- 纯样式：修改 `style.css`，不要把样式逻辑放进事件处理器。

## 离线构建

Vite 生成 IIFE 经典脚本，构建插件将脚本和 CSS 内嵌到 HTML。新增字体、贴图或其他资源必须继续内嵌；外置资源会触发构建失败。不要改成运行时 CDN 或 fetch 本地资源，否则会破坏断网和 file:// 打开能力。

无需引入通用组件框架、后端或状态库来修改现有功能。只有具体需求使现有分工不再清晰时，再增加抽象。
