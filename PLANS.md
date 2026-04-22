# AI Exporter Plans

## 用途

`PLANS.md` 是计划层入口，用来帮助后续 agent 快速判断当前项目有哪些长期任务、复杂任务和接力规则。
短小修复直接改代码并在最终回复说明验证结果。
跨模块、影响数据契约或需要持续接力的工作，应建立执行计划并在这里索引。

## 什么时候创建或更新 ExecPlan

满足以下任一条件时，应创建或更新 ExecPlan：

- 同时影响 `core/`、`src/server/`、`viewer/`、`adapter/` 或测试中的多个边界
- 改动统一 schema、manifest、导入导出格式或插件语义
- 新增一个 agent 来源或 adapter，需要持续验证真实样本
- 需要数小时到数天推进，或者中途会产生新发现、新决策和范围调整
- 需要后续 agent 无缝接力

建议路径：

```text
docs/exec-plans/
  active/
  completed/
  tech-debt/
```

当前目录还没有建立完整 exec-plan 树。
第一次出现复杂任务时，先创建上述目录和 `docs/exec-plans/README.md`。

## 当前活跃计划

- 当前无 active ExecPlan

## 已知可推进方向

- 扫描源覆盖：为新增 agent 或真实路径补 `PATH_PATTERNS`、source 归一化、fixture 和单元测试
- Schema 收敛：明确 thread、plan、task、artifact、rule、config 等类型的字段边界
- Server/Core 去重：把 server handler 中的临时转换、分页读取、stats 流式逻辑沉淀到 core
- Viewer 验证：为大数据量、分页、sourceDirs/dataDir 设置、SSE 进度和插件执行补验收路径
- Adapter 验证：为 Cursor、Claude、Codex、Antigravity 的导入导出建立样例和测试
- 隐私插件：脱敏、secret 清理、资产清理等插件应补 dry-run 或统计优先的验证方式

## ExecPlan 最低要求

每个 ExecPlan 至少包含：

- `Status`
- `Goal`
- `Scope`
- `Progress`
- `Surprises & Discoveries`
- `Decision Log`
- `Validation`
- `Outcomes & Retrospective`

更新规则：

- `Progress`：每次停点都更新
- `Decision Log`：出现关键取舍时更新
- `Surprises & Discoveries`：发现真实数据格式差异、性能问题、平台差异或隐私风险时更新
- `Validation`：记录具体命令、手动路径、样本范围和未覆盖风险
- `Outcomes & Retrospective`：阶段完成或计划完成时更新

## 验证规则

- 单个 core 函数改动：运行相关 `node --test tests/unit/<name>.test.js`
- 扫描、标准化、转换、manifest 改动：优先运行 `npm test`
- Server API 改动：运行相关单元/集成测试，并说明手动 API 或 viewer 验证路径
- Viewer 改动：启动 `npm run serve` 后检查关键流程，至少覆盖扫描设置、列表读取、详情读取和相关按钮状态
- 插件或导入写回改动：使用临时目录或合成样本验证，避免直接操作真实 agent 数据目录

## 计划层边界

- 长期稳定知识写入 `ARCHITECTURE.md` 或 `docs/`
- 使用说明写入 `README.md`
- 单次复杂任务过程写入 `docs/exec-plans/`
- 完成后只把仍然稳定的结论回收进架构或 docs，不把过程记录塞进 `AGENTS.md`
