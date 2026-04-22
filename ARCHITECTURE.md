# AI Exporter Architecture

## 目标

这个仓库的目标是成为一个可持续演进的 AI coding history exporter。
它需要稳定处理三类复杂性：

- 来源复杂：Cursor、Claude Code、Codex/OpenCode、Antigravity、iFlow、Qoder、Windsurf 等工具的存储路径和数据格式都不同
- 数据敏感：扫描对象可能包含私有代码、对话、路径、密钥、截图引用和工具调用结果
- 输出多样：同一批记录需要支持备份、浏览、统计、Markdown、训练 JSONL、ShareGPT、多轮消息格式和 agent 间迁移

架构优先级是：数据安全、schema 稳定、扫描可控、转换可验证、CLI 和 Web UI 共用核心能力。

## 最小目标结构

```text
Al-exporter/
  AGENTS.md
  README.md
  ARCHITECTURE.md
  PLANS.md
  docs/
    README.md
  core/
    scan.js
    normalize.js
    convert.js
    import.js
    schema-validator.js
    cursor_sqlite.js
    plugins/
  src/
    cli.js
    commands/
    server/
    logger.js
  adapter/
  viewer/
  tests/
    unit/
    integration/
```

## 文档职责边界

- `AGENTS.md`：项目入口、阅读顺序、任务路由、硬约束
- `ARCHITECTURE.md`：稳定的数据流、模块边界、设计原则、验证策略
- `PLANS.md`：复杂任务入口、活跃计划索引、执行计划规则
- `docs/README.md`：后续文档导航，承载稳定知识和专题说明入口
- `README.md`：面向使用者的安装、功能、命令、API 概览

## 核心数据流

```text
source directories
  -> core/scan.js
  -> raw candidate files
  -> core/normalize.js
  -> unified thread records
  -> core/schema-validator.js
  -> core/convert.js or core/import.js
  -> agent-backup/ / JSONL / Markdown / Web UI / agent adapters
```

Web 路径基本复用同一条链路：

```text
viewer/index.html
  -> src/server/index.js REST + SSE
  -> core scan / normalize / convert / plugins / adapter
  -> local dataDir
```

## 主要分层

### 1. Core

`core/` 是项目的行为中心。

- `scan.js` 负责扫描根目录解析、深度策略、glob 过滤、并发读取、文件候选过滤
- `normalize.js` 负责来源识别、类型识别、多格式解析、统一 schema 构造、token 粗估、warnings
- `schema-validator.js` 负责统一记录的结构验证
- `convert.js` 负责训练数据、ShareGPT、多轮消息、Markdown、stats 和目录写入
- `import.js` 负责把统一记录写回指定 agent 的目标目录
- `cursor_sqlite.js` 负责 VS Code 家族 `.vscdb` 数据提取
- `plugins/` 承载脱敏、隐私清理、素材清理、裁剪、闲聊清理、密钥清理等数据后处理能力

Core 层应保持可被 CLI、server 和测试直接调用。

### 2. CLI

`src/cli.js` 是现代 CLI 入口，`index.js` 是 legacy direct-run 入口。

命令实现位于 `src/commands/`：

- `scan`：只扫描并报告，不写备份
- `export`：扫描、标准化、增量写入 manifest 和记录
- `convert`：把备份转换为训练格式、ShareGPT、多轮消息或 Markdown
- `stats`：按 project/source/month/type 等维度聚合
- `import`：导入外部 JSON/JSONL 到统一 schema
- `serve`：启动本地 Web UI

新增命令时优先把业务逻辑放 core 或独立 command 模块，`src/cli.js` 只做参数解析和路由。

### 3. Server And Viewer

`src/server/index.js` 提供本地 HTTP API、SSE job 进度、静态 viewer 服务和插件入口。
默认绑定 `127.0.0.1`，适合处理敏感本地数据。

`viewer/index.html` 是前端单页界面。
改 Web 功能时要同时确认 API 返回结构、job 状态、分页读取和 dataDir/sourceDirs 设置逻辑。

### 4. Adapter

`adapter/` 负责 agent 间格式互转，当前包含 Cursor、Claude、Codex、Antigravity 和通用 transformer。
这一层应围绕统一 schema 组织，不应绕过 normalize/validator 直接拼写多套结构。

### 5. Tests

当前测试使用 Node 内置 test runner。

- `tests/unit/` 覆盖扫描根、工具函数、标准化、转换等核心行为
- `tests/integration/` 覆盖 export pipeline、manifest 和 schema 验证

跨 core 的改动优先补单元测试。
影响输出目录、manifest、schema 或 server 行为时补集成或端到端验证说明。

## 推荐推进顺序

1. 先稳定统一 schema 和 validator。schema 是 CLI、Web UI、训练转换、adapter 的共同契约。
2. 再收敛扫描层。新增来源时同时补路径、识别、fixture 和测试。
3. 然后整理命令与 server 共用逻辑，减少 handler 内的临时转换和重复写盘逻辑。
4. 再推进 viewer 的数据浏览、过滤、插件执行和大数据量分页体验。
5. 最后扩展跨 agent 迁移能力。每个 adapter 都应有输入输出样例和最小测试。

## 安全与隐私原则

- 默认本地运行，默认 loopback 服务
- 文档示例使用合成数据，不复制真实 conversation
- 日志显示数量、source、状态和错误摘要，避免打印完整消息体
- 插件处理真实数据前应支持预览、统计或可回滚的输出目录
- 对导入写回 agent 目录的操作保持显式 source 和目标目录，避免静默覆盖
