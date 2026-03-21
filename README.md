<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0:ff9a9e,50:fad0c4,100:96deda&height=260&text=Observation%20Deck&desc=ALp_Studio%20Front-End%20Station&fontAlign=50&fontAlignY=35&descAlign=50&descAlignY=60&fontSize=64&descSize=18&animation=twinkling" />
</p>

<div align="center">

### 你好，这里是亓翎。

这里是我堆放观察日志和数据碎片的地方。

最近做了一轮“拆掉堆砌代码”的大修，站点现在终于不再像一团打结的线了。（瘫倒）

</div>

---

### `[tika@lab ~]$ cat project.log`
```log
┌─ project.log
│ [项目名称] ALp_Studio Home
│ [当前版本] v2.4+ (模块化重构阶段)
│
│ [本轮改造]
│   01. 将单文件脚本拆分为模块化结构，script.js 仅保留调度职责。
│   02. 统一配置加载链路，减少页面重复 fetch 与解析逻辑。
│   03. 移动端性能收敛（降低特效负担，减少快速滑动错位感）。
│   04. 增加访问守卫：微信内置浏览器拦截、移动端继续访问提示。
└─
```

### `[tika@lab ~]$ cat routes.log`
```log
┌─ routes.log
│ /
│ /ProjectList/
│ /status/
│ /maintenance/
│ /404.html
└─
```

---

### `[tika@lab ~]$ cat feature-map.md`
- 欢迎屏与主界面揭示（可按设备降级）。
- 主题切换（深浅色）与本地持久化。
- 设置面板（高对比、轻量模式、动效项、音乐行为）。
- 天气模块（Open-Meteo）。
- 音乐模块（APlayer + Meting）与 Hitokoto 回退。
- 最新文章卡片（`config.json.latest_articles`）。
- 项目列表页（`config.json.projects`）。
- 状态页（读取 `status.json`，失败时回退目标占位）。
- CLI 彩蛋（`~` / `` ` `` 唤起）。

### `[tika@lab ~]$ cat access-guard.md`
- 微信内置浏览器（`MicroMessenger`）：
  - 拦截访问并提示“在浏览器打开”。
- 移动端设备：
  - 首次会话弹窗提示“推荐电脑端访问，但可继续在手机访问”。

### `[tika@lab ~]$ cat lite-mode.md`
- `liteMode` 是主性能开关。
- 开启后以下项会直接浅灰并禁用（不可设置）：
  - `starfield`
  - `shootingStars`
  - `raindrops`
  - `cardFloat`

---

### `[tika@lab ~]$ tree -L 2`
```text
Home/
├─ index.html
├─ 404.html
├─ maintenance/
│  └─ index.html
├─ ProjectList/
│  └─ index.html
├─ status/
│  └─ index.html
├─ css/
│  ├─ style.css
│  └─ style-enhanced.css
├─ js/
│  ├─ access-guard-module.js
│  ├─ cli-module.js
│  ├─ clock-module.js
│  ├─ config-loader-module.js
│  ├─ home-page-extensions.js
│  ├─ interactive-effects-module.js
│  ├─ music-module.js
│  ├─ navigation-effects-module.js
│  ├─ project-list.js
│  ├─ script.js
│  ├─ settings-panel-module.js
│  ├─ status.js
│  ├─ theme-bootstrap.js
│  ├─ theme-module.js
│  ├─ weather-module.js
│  ├─ welcome-effects-module.js
│  └─ welcome-screen-module.js
├─ scripts/
│  ├─ rss-fetch.mjs
│  └─ status-check.mjs
├─ .github/workflows/
│  ├─ rss-update.yml
│  └─ status-check.yml
├─ config.json
├─ start-server.bat
├─ ARCHITECTURE.md
└─ README.md
```

---

### `[tika@lab ~]$ cat runbook.md`
1. 启动本地服务：
```bash
start-server.bat
```
或
```bash
python -m http.server 5173
```
2. 访问：`http://localhost:5173/`
3. 不建议 `file://` 直开页面（配置、天气、状态数据都会受影响）。

### `[tika@lab ~]$ cat config.md`
`config.json` 关键字段：
- `netease_music_items`
- `latest_articles`
- `projects`
- `status_checks`

状态数据来源：
- 前端状态页优先读取 `status_checks.dataUrl` 指向的 `status.json`。
- 失败后回退 `targets` 的占位状态展示。

### `[tika@lab ~]$ cat automation.md`
- `scripts/rss-fetch.mjs` + `.github/workflows/rss-update.yml`
  - 拉取 RSS，更新 `latest_articles`，发布到 `rss-data` 分支。
- `scripts/status-check.mjs` + `.github/workflows/status-check.yml`
  - 检测目标可达性，生成 `status.json`，发布到 `status-data` 分支。

---

### `[tika@lab ~]$ cat integrations.md`
- APlayer `1.10.1`（jsDelivr）
- MetingJS `2`（jsDelivr）
- Font Awesome `6.4.0`（cdnjs）
- Open-Meteo API
- Hitokoto API

---

### `[tika@lab ~]$ cat checklist.md`
- [ ] 首页无报错，欢迎屏和主题切换正常
- [ ] 文章/项目/状态页渲染正常
- [ ] 微信内置浏览器能触发拦截
- [ ] 移动端首次提示仅出现一次（同会话）
- [ ] 轻量模式开启后，4 个高开销项浅灰且不可点
- [ ] 移动端快速滑动时无明显错位/卡顿

---

<div align="center">
实例仍在运行，日志尚未终止。
Thanks for stopping by.（挥手）

</div>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=110&section=footer&color=gradient&customColorList=0:ff9a9e,50:fad0c4,100:96deda" />
</p>
