# 贡献指南

[简体中文](CONTRIBUTING.md) · [English](CONTRIBUTING.en.md)

感谢你帮助改进码一下 QR。请先搜索已有 Issue，避免重复。普通缺陷和功能建议请使用仓库的 Issue 模板；安全问题请阅读 [SECURITY.md](SECURITY.md)，不要公开提交漏洞细节。

## 本地准备

需要 Node.js 20.19+。克隆仓库后运行：

```bash
npm ci
npx playwright install chromium
npm run check
npm test
```

在 `chrome://extensions` 加载 `dist` 目录，可手动检查右键菜单、图片识别、框选和生成流程。运行 `npm run dev` 可以在修改源码时持续构建；扩展页面可能需要手动重新加载。

## 提交变更

1. 从 `main` 创建短生命周期分支。
2. 每个 Pull Request 聚焦一个问题，并说明用户可见的变化。
3. 修改功能时更新相关测试和文档；修改权限或数据处理时同时检查隐私政策。
4. 提交前运行 `npm run check` 和 `npm test`。
5. 使用 Pull Request 模板说明测试结果。中文或英文均可。

商店安装包由维护者发布。请勿在 Pull Request 中提交 `dist/`、`node_modules/` 或 ZIP 构建产物。
