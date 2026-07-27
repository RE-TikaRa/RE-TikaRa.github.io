<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0:ff9a9e,50:fad0c4,100:96deda&height=260&text=Observation%20Deck&desc=ALp_Studio%20Front-End%20Station&fontAlign=50&fontAlignY=35&descAlign=50&descAlignY=60&fontSize=64&descSize=18&animation=twinkling" />
</p>

<div align="center">

### 你好,这里是亓翎。

这里是我堆放观察日志和数据碎片的地方。

站点整站重做了一轮,从纯静态站迁到 Astro,视觉推倒成了工程蓝图的样子。(瘫倒)

</div>

---

### `[tika@lab ~]$ cat project.log`
```log
┌─ project.log
│ [项目名称] ALp_Studio Home
│ [当前版本] v3.0 (Astro 整站重设计)
│
│ [本轮改造]
│   01. 从纯静态站迁到 Astro 5 + React 岛,数据链路与视觉外壳分离。
│   02. 双维度主题:light 羊皮纸科学手稿 / dark 冷峻 CAD 蓝图,共享结构只换皮肤。
│   03. 动效换成 GSAP 描边入场 + 手写 3D 线框背景,删尽旧粒子系统。
│   04. 全本地字体零 CDN,衬线为主。
└─
```

### `[tika@lab ~]$ cat routes.log`
```log
┌─ routes.log
│ /               控制台仪表盘
│ /projects/      项目卡片列表
│ /status/        状态监测网格
│ /maintenance/   维护占位
│ /404.html       信号丢失
└─
```

---

### `[tika@lab ~]$ cat feature-map.md`
- 双维度主题(昼夜)切换与本地持久化。
- 控制台仪表盘首页(档案 / 天气 / 日期 / 音乐 / 一言 / 文章 6 模块)。
- 设置面板(高对比 / 轻量模式 / 背景线框 / 网格扫描线 / 音乐行为)。
- 天气模块(Open-Meteo)与 `data-weather` 氛围联动。
- 音乐模块(APlayer + Meting)与播放脉冲。
- 一言回声(Hitokoto)。
- 最新文章卡片(`config.json.latest_articles`)。
- 项目列表页(`config.json.projects`)。
- 状态页(读取 `status.json`,失败回退目标占位)。
- CLI 彩蛋。
- 3D 线框背景(手写投影,昼夜切皮肤)。
- 访问守卫(微信拦截 / 移动端提示)。

### `[tika@lab ~]$ cat theme.md`
- `light`(默认 · 过去):羊皮纸底 + 铁胆墨水褐 + 普鲁士蓝标注,古典衬线。
- `dark`(未来):深蓝黑底 + 蓝图青细线 + 硬边发光。
- 两维度共享同一套图框 / 网格 / 标注结构,`data-theme` 只换皮肤语言。

### `[tika@lab ~]$ cat lite-mode.md`
- `liteMode` 是性能主开关。
- 开启后 `wireframe`(背景线框)与 `scanline`(网格扫描线)会联动禁用。
- 动效降到仅 fade,线框静态无旋转。

---

### `[tika@lab ~]$ tree -L 2`
```text
Home/
├─ src/
│  ├─ pages/          # index / projects / status / maintenance / 404
│  ├─ layouts/        # BaseLayout.astro
│  ├─ components/     # 图框 / 导航 / 岛 / cards
│  ├─ lib/            # config / theme / motion / page-motion / wireframe / access-guard / shared
│  └─ styles/         # global.css(@theme + data-* + 图框 class)
├─ public/
│  ├─ fonts/          # 全本地字体
│  ├─ config.json     # 站点数据源
│  ├─ auth/
│  └─ CNAME
├─ scripts/
│  ├─ rss-fetch.mjs
│  ├─ status-check.mjs
│  └─ smoke-motion.mjs
├─ .github/workflows/
│  ├─ rss-update.yml
│  └─ status-check.yml
├─ astro.config.mjs
├─ package.json
├─ ARCHITECTURE.md
├─ AGENTS.md
└─ README.md
```

---

### `[tika@lab ~]$ cat runbook.md`
1. 安装依赖:
```bash
npm install
```
2. 本地开发:
```bash
npm run dev
```
3. 构建 + 预览:
```bash
npm run build
npm run preview
```
4. 冒烟测试(需先 `npm run preview` 起服务):
```bash
node scripts/smoke-motion.mjs
```

### `[tika@lab ~]$ cat config.md`
`config.json` 关键字段:
- `netease_music_items`
- `latest_articles`
- `projects`
- `status_checks`

状态数据来源:
- 状态页优先读取 `status_checks.dataUrl` 指向的 `status.json`。
- 失败后回退 `targets` 的占位状态展示。

### `[tika@lab ~]$ cat automation.md`
- `scripts/rss-fetch.mjs` + `.github/workflows/rss-update.yml`
  - 拉取 RSS,更新 `latest_articles`,发布到 `rss-data` 分支。
- `scripts/status-check.mjs` + `.github/workflows/status-check.yml`
  - 检测目标可达性,生成 `status.json`,发布到 `status-data` 分支。

---

### `[tika@lab ~]$ cat integrations.md`
- APlayer `1.10.1`(jsDelivr)
- MetingJS `2`(jsDelivr)
- Font Awesome `6.4.0`(cdnjs)
- Open-Meteo API
- Hitokoto API

---

### `[tika@lab ~]$ cat checklist.md`
- [ ] 首页无报错,昼夜主题切换正常
- [ ] 文章 / 项目 / 状态页渲染正常
- [ ] 图框描边入场就位,线框背景运转
- [ ] 微信内置浏览器能触发拦截
- [ ] 移动端首次提示仅出现一次(同会话)
- [ ] 轻量模式开启后,背景线框与扫描线禁用
- [ ] 三档降级(reduced / lite / mobile)路径正确

---

<div align="center">
实例仍在运行,日志尚未终止。
Thanks for stopping by.(挥手)

</div>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=110&section=footer&color=gradient&customColorList=0:ff9a9e,50:fad0c4,100:96deda" />
</p>
