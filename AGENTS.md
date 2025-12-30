# Repository Guidelines

## 项目结构与模块组织
- `index.html`：页面结构与文案入口。
- `css/style.css`：主题、布局与动画样式。
- `js/script.js`：交互模块（欢迎屏、视差、天气、音乐、CLI）。
- `config.json`：网易云音乐列表配置。
- `fonts/`：本地字体资源；`CNAME`：自定义域名记录。
- 本项目为纯静态站点，无后端与数据库。

## 本地开发与运行
- `start-server.bat`：启动本地静态服务器（端口 5173）。
- 或使用 `python -m http.server 5173`。
- 访问 `http://localhost:5173/` 进行预览。
- 生产部署可用任意静态托管。

## 代码风格与命名
- 缩进 4 空格，保持现有注释头与结构。
- JS 采用单文件 IIFE 组织，使用 `const/let` 与分号。
- CSS 按 `@layer tokens, base, components, utilities, overrides` 分层追加。
- 文件命名保持小写；新增资源优先放入 `fonts/` 或新增 `assets/`。

## 测试指南
- 当前无自动化测试框架。
- 手动检查：页面加载、主题切换、欢迎动画、星空/雨滴、音乐与 Hitokoto 回退、CLI（`~` 或反引号）以及控制台无报错。

## 提交与 PR 规范
- 提交信息遵循 Conventional Commits：`feat:`、`fix:` 等（示例：`fix: 调整卡片间距`）。
- 主题简短命令式，必要时添加 scope。
- PR 需包含简要说明；有 UI 改动请附截图/GIF；涉及外部资源或 API 变更需说明。

## 配置与外部依赖
- 修改 `config.json` 的 `netease_music_items` 以更新播放列表。
- 依赖 Open-Meteo、Hitokoto、APlayer/Meting、Font Awesome 等外部服务与 CDN；部署需 HTTPS 或 localhost。
