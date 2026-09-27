# 参数来源与准确性边界

| 型号                          |  SM | FP32 核心 | 显存            | Compute Capability |
| ----------------------------- | --: | --------: | --------------- | ------------------ |
| A800 SXM4                     | 108 |      6912 | 80 GB HBM2e     | 8.0                |
| RTX 4090 D                    | 114 |     14592 | 24 GB GDDR6X    | 8.9                |
| RTX PRO 5000 Blackwell        | 110 |     14080 | 72 GB GDDR7 ECC | 12.0               |
| RTX 5090                      | 170 |     21760 | 32 GB GDDR7     | 12.0               |
| RTX PRO 6000 Blackwell Server | 188 |     24064 | 96 GB GDDR7 ECC | 12.0               |
| B200                          | 148 |     18944 | 180 GB HBM3e    | 10.0               |

B200 按公开 180 GB 配置建模。使用 180 GB 公开配置建模；双 Die、8 组 HBM3e。每个型号的来源链接在「资料与边界」中。

主要依据：[Ampere 架构](https://developer.nvidia.com/blog/nvidia-ampere-architecture-in-depth/)、[Ada 白皮书](https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf)、[Blackwell RTX 白皮书](https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf)、[Blackwell 调优指南](https://docs.nvidia.com/cuda/blackwell-tuning-guide/)。产品规格来源保存在 `src/data/catalog.ts`；B200 SM 数来自 [NVIDIA DGX Spark 对比说明](https://developer.nvidia.com/blog/scaling-autonomous-ai-agents-and-workloads-with-nvidia-dgx-spark/)，容量来自 [DGX B200 文档](https://docs.nvidia.com/dgx/dgxb200-user-guide/introduction-to-dgxb200.html)。A800 的 SM/CUDA 数参考 NVIDIA 论坛公开 deviceQuery 记录；未找到可核实的具体 SKU L2 容量时显示「未核验」。

**GPC/TPC 的分组、禁用位置是教学排布，不是各 SKU 的实际熔丝图。** 布局 SM ID 保留禁用槽位，可能大于启用 SM 数。PRO 5000 的层级借用 RTX Blackwell 完整结构作导航示意。GDDR 的正面颗粒用于说明板上显存关系，不据此反推颗粒容量或背面排布。

GA100 每分区 16 FP32 / 16 INT32 / 8 FP64 / 1 Tensor Core；Ada 每分区 16 专用 FP32 + 16 共享 FP32/INT32；RTX Blackwell 使用统一 FP32/INT32 通路，不能把二者核心数相加。Ada / RTX Blackwell 的 2 FP64 是每 SM 数量，不复制到四个分区。B200 与 RTX Blackwell 分别使用 SM 10.0 与 12.0，TMEM 只在 B200 标注。B200 动画仅采用通用 mma 路径，不模拟 tcgen05/TMEM 时序。RT 单元为结构标注，不参与示例程序。

表面纹理是程序生成的视觉示意，并非显微实拍、精确掩膜或制造版图。封装轮廓、触点与被动元件的位置用于强化质感，不代表实际板卡 BOM。

所有几何位置、HBM 堆叠层数、路径、指令、访存未命中、等待时间和 warp 分配均为教学示意；绝不用于时延、吞吐或占用率估算。四个分区的 8 个示例 warp 不表示硬件驻留上限。上层视图的数据流折叠为代表性 SM 的路径，下钻后才展开内部单元。

JSONL 字段：`{ schema, source, timeUnit, cycle, sm, subpart, warp, event, from, to, sku, architecture, computeCapability, memoryType, smIdKind }`。`schema=gpu-viz/1`、`source=schematic`、`timeUnit=teaching-tick`。`cycle` 是兼容后续事件格式的字段名，当前数值不是硬件 cycle。一轮为 240 ticks；循环起点已有其他 warp 在途中，阶段转换按 warp 相位偏移排序。`dram` 是通用显存端点，具体类型由 `memoryType` 指定；`smIdKind=schematic-layout`。导出一轮 64 条阶段转换事件，不导出每帧插值粒子坐标。

未连接任何集群，没有触碰 B200。尚未实现周期精确模拟、scoreboard 依赖图、cache 模型、真实数据回放、章节脚本、粒子点击、后处理 bloom。ncu 聚合统计不能被伪装成逐 warp 执行轨迹；真实适配器必须说明采样粒度、时间轴和缺失信息。
