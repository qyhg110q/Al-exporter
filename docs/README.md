# Docs

`docs/` 是 AI Exporter 的稳定知识区。
根层文件负责入口、架构和计划规则；这里用于承载后续专题说明、执行计划、样本格式和验证记录。

## 路由

- 想看项目总体边界：回到 `../ARCHITECTURE.md`
- 想看接力规则和活跃任务：回到 `../PLANS.md`
- 想看使用方式：回到 `../README.md`
- 想记录复杂任务过程：建立 `exec-plans/active/<date>-<topic>.md`
- 想沉淀 source/adapter/schema/plugin 的稳定结论：优先在本目录建立专题文档，再从这里加入口

## 建议知识分层

```text
docs/
  README.md
  exec-plans/
    README.md
    active/
    completed/
    tech-debt/
  schema/
  sources/
  adapters/
  plugins/
  validation/
```

这些目录按需创建。
当前只建立导航入口，避免提前制造空文档。

## 文档维护原则

- 真实用户数据、导出记录、私有路径和密钥不要写入文档
- 样例使用合成数据，并标明来源格式和预期统一 schema
- 新增 agent 来源时，建议记录路径模式、样本结构、识别规则、风险和测试命令
- 新增 adapter 时，建议记录输入 schema、输出目标、不可逆字段、导入写盘位置和验证方法
- 新增插件时，建议记录处理目标、是否 destructive、dry-run 能力、输出统计和回滚方式
