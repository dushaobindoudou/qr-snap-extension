# Chrome Web Store 上架文案

## 名称

码一下 QR · 网页二维码识别与生成

## 简短说明

右键识别网页图片二维码，截图框选识别，一键生成网址或选中文字的二维码。本地处理，无需账号。

## 详细说明

网页上的二维码，电脑也能直接识别。

在图片上右键，选择「码一下 QR → 识别这张图片的二维码」，即可查看内容、复制文字，或自行决定是否打开识别出的链接。遇到截图、背景图或多个二维码时，可截取当前可见页面并拖动框选。也支持上传本地图片。

需要分享内容时，点击工具栏按钮生成当前网址或自定义文字的二维码；也可以在网页链接、选中文字上右键生成。二维码支持复制图片和下载 PNG。

所有图片和文本都在浏览器本地处理，无需注册，没有云端识别服务。仅在你主动点击工具栏或右键菜单时访问当前标签页。

说明：截图识别范围是当前可见画面；不支持自动滚动整页。识别出的链接不会自动打开。

## 单一用途声明

在浏览器内识别和生成二维码。

## 权限说明

- activeTab：用户主动操作时读取当前标签页网址或截取可见画面。
- contextMenus：提供图片、链接、选中文字和页面的右键入口。
- scripting：定位被右键点击的图片在页面中的位置。
- storage：在本地临时传递截图或文本给结果页，读取后删除。

## 素材

- 图标：`public/icons/128.png`
- 截图：`store/screenshot-scan.png`、`store/screenshot-generate.png`
- 宣传图：`store/promo-small.png`

## 发布页面链接

- 隐私政策：https://github.com/dushaobindoudou/qr-snap-extension/blob/main/PRIVACY.md
- 主页：https://github.com/dushaobindoudou/qr-snap-extension
- 支持：https://github.com/dushaobindoudou/qr-snap-extension/issues
- 安装包：https://github.com/dushaobindoudou/qr-snap-extension/releases/download/v0.1.0/qr-snap-extension.zip
