# 码一下 QR / QR Snap

[简体中文](README.md) · [English](README.en.md)

在网页图片上右键识别二维码，截取当前可见页面并框选识别，也可以为网址、链接和选中文字生成二维码。所有处理都在浏览器本地完成，无需账号或服务器。

> 当前 [v0.2.0 GitHub Release](https://github.com/dushaobindoudou/qr-snap-extension/releases/tag/v0.2.0) 已提供中英文界面。已提交商店的 v0.1.0 包仍为中文界面；双语版本将通过后续商店更新交付。也可以按下方步骤从源码加载。

![截图识别界面](store/screenshot-scan.png)

## 功能

- **图片右键识别**：在网页图片上右键选择“码一下 QR → 识别这张图片的二维码”。扩展截取当前可见页面，并优先扫描该图片所在区域。
- **截图框选识别**：从工具栏或页面右键菜单截取当前画面，在结果页拖动鼠标框选二维码；也可以扫描整张截图。
- **二维码生成**：为当前页面网址、自定义文字、链接或选中文字生成二维码，支持复制图片和下载 PNG。
- **本地图片识别**：上传图片并在本地扫描；识别结果可复制，链接由用户决定是否打开。

## 安装与开发

需要 Node.js 20.19+、npm 和 Chrome 或 Chromium。

```bash
npm ci
npm run build
```

打开 `chrome://extensions`，启用开发者模式，点击“加载已解压的扩展程序”，选择本仓库的 `dist` 目录。

```bash
npm run check    # JavaScript 语法检查
npm test         # 构建并运行浏览器集成测试
npm run package  # 生成商店上传用 ZIP
```

测试需要 Playwright Chromium。若本机尚未安装，可运行 `npx playwright install chromium`。

## 项目结构

| 路径 | 内容 |
| --- | --- |
| `src/background.js` | 右键菜单、截图与结果页入口 |
| `src/popup.js`、`popup.html` | 工具栏弹窗 |
| `src/result.js`、`result.html` | 识别、框选与生成界面 |
| `src/qr.js` | 二维码编码与解码 |
| `public/manifest.json` | 扩展清单与权限 |
| `tests/` | 浏览器集成测试 |
| `store/` | 商店截图和宣传图 |

## 权限与隐私

`activeTab` 仅在用户主动操作时访问当前标签页；`contextMenus` 添加右键入口；`scripting` 定位右键图片；`storage` 在扩展内部临时传递截图和内容。扩展不申请全站访问权限，也不向开发者或第三方发送图片、网址、选中文字或识别结果。详见 [隐私政策](PRIVACY.md)。

## 已知边界

截图仅覆盖当前可见画面，不会自动滚动整页。右键图片若被遮挡、位于画面外或跨域 iframe 中，自动定位可能失败；可以改用框选或上传图片。当前只识别标准 QR Code，不识别条形码或 Data Matrix。

## 参与项目

欢迎提交 [Issue](https://github.com/dushaobindoudou/qr-snap-extension/issues) 或 Pull Request。请先阅读[贡献指南](CONTRIBUTING.md)和[安全报告说明](SECURITY.md)。文档和 v0.2.0 源码界面提供简体中文和英文版本，扩展界面跟随 Chrome 的语言设置。
