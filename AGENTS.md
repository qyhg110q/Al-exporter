# AI Exporter AGENTS

## 项目定位

AI Exporter 是一个 Node.js 本地工具，用来扫描、备份、标准化、转换和浏览 AI 编码工具的对话数据。
项目核心价值在于把多来源、格式不稳定的 agent 历史统一成可验证的 schema，并提供 CLI 与本地 Web UI 两条使用路径。

## 首读顺序

1. `README.md`
2. `ARCHITECTURE.md`
3. `PLANS.md`
4. `docs/README.md`
5. 相关源码入口：`src/cli.js`、`core/scan.js`、`core/normalize.js`、`src/server/index.js`

## 任务路由

- 想理解项目结构、数据流和模块边界：看 `ARCHITECTURE.md`
- 想执行跨模块任务、长期任务或需要接力的任务：看 `PLANS.md`
- 想改 CLI 命令：从 `src/cli.js` 和 `src/commands/` 进入
- 想改扫描范围、目录发现、文件过滤：看 `core/scan.js`
- 想改格式识别、schema 字段、source 归一化：看 `core/normalize.js` 和 `core/schema-validator.js`
- 想改导出、训练格式、Markdown、统计：看 `core/convert.js` 与 `src/commands/convert.js`
- 想改 Web UI 或 API：看 `viewer/index.html` 和 `src/server/index.js`
- 想改跨 agent 导入导出适配：看 `adapter/` 与 `core/import.js`
- 想改隐私、清理、裁剪插件：看 `core/plugins/`
- 想确认行为：看 `tests/unit/` 和 `tests/integration/`

## 工作约束

- `AGENTS.md` 只保留入口、路由和少量硬约束；稳定知识写入 `ARCHITECTURE.md` 或 `docs/`
- 优先保护用户数据：默认本地运行，避免外部网络依赖，新增日志时不要输出完整对话内容、密钥或私有路径
- 扫描逻辑要保守：新增目录模式时同步考虑忽略规则、文件大小上限、并发和 Windows/macOS/Linux 路径
- Schema 改动要同步更新验证、转换、viewer 读取逻辑和测试
- CLI 与 Web API 能力应尽量共用 core 层，不在 server handler 中复制核心逻辑
- 代码改动至少运行相关 `node --test ...`；跨 core/server 的改动优先运行 `npm test`
- 改 UI 或 Web API 时，至少给出手动验证路径；需要真实浏览器时启动 `npm run serve`
- 不要把 `agent-backup/`、真实导出数据、用户会话数据或本地配置文件提交进文档示例
