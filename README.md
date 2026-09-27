# GPU Atlas

可离线打开的 GPU 架构探索工具：从芯片封装下钻到 GPC、TPC、SM 和处理分区，观察示意指令流。使用 TypeScript、Three.js 和 GSAP，无后端服务。

支持 A800、RTX 4090 D、RTX PRO 5000 Blackwell 72 GB、RTX 5090、RTX PRO 6000 Blackwell Server、B200；另有 A100 / 完整 GA100 参考配置。

## 使用

构建后的 `dist/index.html` 是完整的离线页面，约 650 KB。双击用支持 WebGL 2 的浏览器打开即可，不需要 Node.js、联网或 server。页面内的资料链接在主动点击时才访问网络。

- 旋转、缩放、俯视和展开芯片结构。
- 切换硅片表面与架构标注；点击计算单元逐层探索。
- 切换 HBM 封装、GDDR 板卡和 B200 双芯片模型。
- 播放、暂停、单步、选择 warp，并导出教学事件 JSONL。

GitHub Actions 的成功构建提供 `GPU-Atlas-offline` 下载产物，解压后直接打开 HTML。macOS 也可以双击仓库中的 `start.command` 打开已构建的页面。

## 开发

要求 Node.js 24 和 pnpm 11.19.0（版本写在 `packageManager` 中）。

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm check
```

| 命令                | 用途                                                     |
| ------------------- | -------------------------------------------------------- |
| `pnpm build`        | 类型检查并生成唯一的 `dist/index.html`                   |
| `pnpm check`        | 格式检查、单元测试、构建和离线产物检查                   |
| `pnpm format`       | 统一格式                                                 |
| `pnpm test`         | 型号、层级、事件流和几何构建契约测试                     |
| `pnpm test:offline` | 构建并检查没有外置入口资源、脚本可按经典 JavaScript 解析 |
| `pnpm dev`          | 可选的开发热更新服务，日常查看不需要                     |
| `pnpm open`         | macOS：打开离线成品                                      |

根目录 `index.html` 是开发模板，查看离线成品请打开 `dist/index.html`。源码修改后重新构建。`package.json` 的 `private: true` 仅防止误发布到 npm，与 GitHub 仓库可见性无关。

## 代码入口

| 文件/目录             | 职责                                  |
| --------------------- | ------------------------------------- |
| `src/main.ts`         | 应用启动、用户操作、动画循环          |
| `src/app-state.ts`    | 应用初始状态与状态类型                |
| `src/data/catalog.ts` | 架构参数、SKU 配置和资料来源          |
| `src/model.ts`        | 层级、启用规则、布局编号              |
| `src/engine.ts`       | 确定性教学时序与 JSONL 导出           |
| `src/ui/`             | 页面结构、侧栏内容、播放状态显示      |
| `src/scene.ts`        | WebGL、相机、拾取、粒子和资源生命周期 |
| `src/render/`         | 绘制基础操作与封装/内部层级几何构建   |
| `src/surfaces.ts`     | 程序纹理与材质缓存                    |
| `src/style.css`       | 页面样式与响应式布局                  |
| `vite.config.ts`      | 将 JS / CSS 内嵌到单个离线 HTML       |

阅读顺序和常见修改步骤见 [架构说明](docs/architecture.md)。提交前的检查流程见 [贡献指南](CONTRIBUTING.md)。

## 准确性边界

这是教学可视化，不是性能模拟器。型号参数附公开来源，但空间位置、GPC/TPC 分组、禁用位置和纹理均为示意。240 ticks 与 8 个 warp 是固定教学序列，不是硬件周期、真实采样或实际占用率。

具体容量、架构差异和未验证项见 [资料与边界](docs/accuracy.md)。项目不连接任何 GPU 或集群。CPU 单元测试和离线文件检查不等同于真实浏览器/WebGL 画面验证。

依赖的许可证由各依赖项目提供；随离线 bundle 保留上游许可证注释，详见 [第三方依赖](docs/third-party.md)。
