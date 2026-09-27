# 开发与提交

使用 Node.js 24 和 `package.json` 指定的 pnpm 版本。安装依赖时使用 `pnpm install --frozen-lockfile`；确需更新依赖时同步提交锁文件。

提交前运行：

```sh
pnpm format
pnpm check
```

修改交互或外观后，还应在支持 WebGL 2 的浏览器打开 `dist/index.html`：切换 HBM、GDDR 和双 Die 型号；下钻到最后的启用分区；测试表面/标注、暂停/单步、展开画布和 JSONL 导出。自动化测试不覆盖真实 GPU 渲染效果。

每个改动应有清楚的目的。型号事实保留来源，未核实数据明确标注；不能把教学轨迹描述成真机时序。新规则添加有意义的行为测试，避免仅重复实现代码的断言。

不要提交 `node_modules`、`dist`、本地 IDE 配置、个人路径、凭据或集群清单。CI 会重新构建并提供离线 HTML 产物。
