# ALp_Studio Architecture Log

### `[tika@lab ~]$ cat architecture.log`
```log
┌─ architecture.log
│ [目标] 让代码可维护,而不是可运行但不可读。
│ [核心原则]
│   01. 数据链路与视觉外壳分离,岛只管逻辑,皮肤交给 global.css。
│   02. 双维度主题共享同一套结构,data-theme 只换皮肤语言。
│   03. 动效走单一 gsap.ticker,三档降级(reduced / lite / mobile)。
│   04. 动态注入的元素命不中 scoped style,样式必须落在 global.css。
└─
```

---

## `[tika@lab ~]$ cat stack.md`

- Astro `5`(`output: static`,根部署 GitHub Pages,`site: https://re-tikara.fun`)
- React `19` 岛(`client:idle` 水合)
- Tailwind `v4`(`@tailwindcss/vite`,`@theme` block + CSS 变量 + `data-*` 属性选择器)
- GSAP + ScrollTrigger + Lenis(入场描边 / 滚动揭示 / 桌面惯性滚动)
- 手写 3D 线框(icosahedron 投影,不引 three.js)

---

## `[tika@lab ~]$ cat tree.md`
```text
src/
├─ pages/
│  ├─ index.astro          # 控制台仪表盘(6 模块 grid-areas)
│  ├─ projects.astro       # 项目卡片列表
│  ├─ status.astro         # 状态监测网格
│  ├─ maintenance.astro    # 维护占位单图框
│  └─ 404.astro            # 信号丢失单图框
├─ layouts/
│  └─ BaseLayout.astro     # 全局壳 + 防闪烁脚本 + 页脚 + 动效入口
├─ components/
│  ├─ Background.astro      # 3D 线框 canvas 挂载
│  ├─ NavPanel.astro        # 桌面左侧导航栏
│  ├─ MobileNav.astro       # 移动端底栏
│  ├─ Panel.astro           # 蓝图图框容器(variant / title / meta)
│  ├─ ThemeToggle.tsx       # 昼夜切换岛
│  ├─ SettingsPanel.tsx     # 设置面板岛
│  ├─ Cli.tsx               # CLI 终端彩蛋岛
│  └─ cards/
│     ├─ ProfileCard.astro  # 档案(#greeting)
│     ├─ DateCard.astro     # 日期时钟(#today)
│     ├─ ArticlesCard.astro # 文章日志(#article-list)
│     ├─ WeatherCard.tsx    # 天气探针
│     ├─ HitokotoCard.tsx   # 一言回声
│     └─ MusicCard.tsx      # 网易云播放器
├─ lib/
│  ├─ config.ts             # fetchConfigJSON 配置加载
│  ├─ theme.ts              # 主题 + VisualSettings 读写
│  ├─ motion.ts             # Lenis + gsap.ticker 调度 + 降级判定
│  ├─ page-motion.ts        # 入场描边 + 滚动揭示编排
│  ├─ wireframe.ts          # 3D 线框投影绘制
│  ├─ access-guard.ts       # 微信拦截 + 移动提示
│  └─ shared.ts             # safeParseObjectJSON / normalizeExternalUrl
└─ styles/
   └─ global.css            # 字体 + @theme tokens + data-* 覆盖 + 图框 class

public/
├─ fonts/                   # 全本地字体(零 CDN)
├─ config.json              # 站点数据源
├─ auth/                    # 保留资产
└─ CNAME                    # 自定义域名
```

---

## `[tika@lab ~]$ cat theme-system.md`

双维度主题,共享结构,只换皮肤:
- `light`(默认 · 过去):羊皮纸科学手稿,铁胆墨水褐 + 普鲁士蓝标注。
- `dark`(未来):冷峻 CAD 蓝图,蓝图青细线 + 硬边发光。

`global.css` 落法:
- `@theme` 定义默认(light)tokens,自动生成工具类(`bg-bg` / `text-accent` / `border-border`)。
- `:root[data-theme="dark"]` 覆盖同名 `--color-*` 变量,工具类自动跟随,不用 `dark:` 变体。
- `[data-contrast="high"]` / `[data-lite="true"]` / `[data-weather="rain"]` 同理只重定义变量。

根属性:
- `data-theme`(light / dark)
- `data-contrast`(high)
- `data-lite`(true)
- `data-weather`(WeatherCard 写入,联动 `--weather-rain-opacity`)

---

## `[tika@lab ~]$ cat fonts.md`

全本地 `public/fonts/`,衬线为主:
- 大标题:`Cormorant`
- 正文拉丁:`EB Garamond`
- 中文衬线:`中华薪火体`(油墨报纸气质)
- 数据显示:`NasaDisplay`(数码管,仅英文数字)
- 等宽:`JetBrains Mono`(CLI / 代码 / 标注)

字体栈变量:`--font-display` / `--font-body` / `--font-latin` / `--font-data` / `--font-mono`。

---

## `[tika@lab ~]$ cat motion.md`

入场与滚动(`page-motion.ts`):
- 单条 `gsap.timeline()` 对 `.blueprint-frame` 面板 stagger。
- 图框用 SVG stroke `stroke-dasharray/dashoffset` 描边绘制,内容随后 fade。
- 滚动揭示走 `ScrollTrigger.batch()`。

背景线框(`wireframe.ts` + `Background.astro`):
- 单个 `#blueprint-wireframe-canvas`,手写顶点数组 + 旋转矩阵 + 透视投影。
- 通过 `registerTicker`(motion.ts)挂到全站唯一 `gsap.ticker`,切后台自动暂停。
- 读 `data-theme` 切皮肤:light 手绘抖动笔触,dark 蓝图青发光描边。

三档降级(`motionLevel()`):
- `reduced`:`gsap.set` 终态,画单帧静态线框,不注册 ticker / Lenis。
- `lite`:仅 fade,无描边绘制,线框静态无旋转。
- `full-mobile`:timeline 保留,无 Lenis 惯性。

---

## `[tika@lab ~]$ cat data-flow.md`

配置加载:
- `fetchConfigJSON()`(`lib/config.ts`)统一读 `public/config.json`,本地 / 远端回退。
- 关键字段:`netease_music_items` / `latest_articles` / `projects` / `status_checks`。

状态数据:
- 状态页优先读 `status_checks.dataUrl` 指向的 `status.json`(status-data 分支)。
- 读取失败回退 `status_checks.targets` 占位展示。

自动化(数据分支机制):
- `scripts/rss-fetch.mjs` + `.github/workflows/rss-update.yml` → 更新 `latest_articles`,发布 rss-data 分支。
- `scripts/status-check.mjs` + `.github/workflows/status-check.yml` → 生成 `status.json`,发布 status-data 分支。

---

## `[tika@lab ~]$ cat contracts.md`

不可改的 DOM id(岛与内联脚本依赖):
- 全局:`#settings-toggle` / `#settings-panel` / `#theme-toggle` / `#back-to-top` / `#main-content`
- 首页脚本:`#greeting` / `#today` / `#latest-articles-card` / `#article-list`
- 线框:`#blueprint-wireframe-canvas`

MusicCard innerHTML 模板保留:`.card-header` / `.card-title` / `.card-meta` / `.music-player-shell` + `is-playing` + `--music-beat`。

VisualSettings(`theme.ts`)字段:
- `highContrast` / `liteMode` / `wireframe` / `scanline` / `musicAutoplay` / `playlistType`
- `liteMode` 开启会联动禁用 `wireframe` 与 `scanline`。

---

## `[tika@lab ~]$ cat access-policy.md`

- 微信内置浏览器(`MicroMessenger`):阻断主流程,提示在浏览器打开。
- 其他移动设备:首访会话提示,允许继续访问(`sessionStorage.tika-mobile-desktop-hint`)。

---

## `[tika@lab ~]$ cat security-policy.md`

- 配置驱动内容渲染统一走 DOM API,不把源数据写进 `innerHTML`。
- 外链经 `normalizeExternalUrl` 过滤,仅放行 `http/https`。

---

## `[tika@lab ~]$ cat regression-checklist.md`

- 四属性切换(theme / contrast / lite / weather)防闪烁
- 图框描边入场就位,滚动揭示生效
- 线框 canvas 就位,三档降级路径正确
- 设置面板联动,音乐播放脉冲(`--music-beat`)
- 天气 / 一言 / CLI / 文章 / 项目 / 状态数据加载
- 微信拦截真正阻断,移动提示仅首访出现
- 控制台无初始化级报错
