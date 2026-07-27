# Repository Guidelines

### `[tika@lab ~]$ cat repo-policy.log`
```log
┌─ repo-policy.log
│ [项目类型] Astro 5 静态站点(React 岛 / 无后端 / 无数据库)
│ [维护目标] 数据链路与视觉外壳分离,禁止回退成堆砌式脚本
└─
```

---

## `[tika@lab ~]$ cat layout.md`

页面(`src/pages/`):
- `index.astro`(控制台仪表盘)
- `projects.astro`
- `status.astro`
- `maintenance.astro`
- `404.astro`

样式:
- `src/styles/global.css`(`@theme` tokens + `data-*` 覆盖 + 图框 class)

核心 lib(`src/lib/`):
- `config.ts` / `theme.ts` / `motion.ts` / `page-motion.ts` / `wireframe.ts` / `access-guard.ts` / `shared.ts`

组件(`src/components/`):
- 图框 `Panel.astro`、导航 `NavPanel` / `MobileNav`、背景 `Background.astro`
- 岛 `ThemeToggle` / `SettingsPanel` / `Cli`,以及 `cards/` 下 6 张卡片

---

## `[tika@lab ~]$ cat contracts.md`

改外壳不许动的技术契约:
- DOM id:`#settings-toggle` / `#settings-panel` / `#theme-toggle` / `#back-to-top` / `#main-content`;首页 `#greeting` / `#today` / `#latest-articles-card` / `#article-list`;线框 `#blueprint-wireframe-canvas`。
- MusicCard innerHTML 模板类:`.card-header` / `.card-title` / `.card-meta` / `.music-player-shell` + `is-playing` + `--music-beat`。
- VisualSettings 字段:`highContrast` / `liteMode` / `wireframe` / `scanline` / `musicAutoplay` / `playlistType`。

动态注入元素(React 岛、`innerHTML` / `createElement`)命不中 Astro scoped style,样式必须落在 `global.css`。

---

## `[tika@lab ~]$ cat theme-rule.md`

- 双维度主题共享结构,`data-theme` 只换皮肤,不写 `dark:` 变体。
- 新增配色 / 尺寸只在 `@theme` 定默认,再用 `:root[data-theme="dark"]` 等属性选择器重定义同名变量。
- `light` 是默认(过去 · 手稿),`dark` 是覆盖(未来 · 蓝图)。

---

## `[tika@lab ~]$ cat code-style.md`

- 保持最小改动,不新增无证据的 abstraction / helper / 兜底逻辑。
- 修正或重构时删掉旧实现,不留兼容残骸。
- 动态内容渲染优先 DOM API。
- 外链统一走协议白名单过滤(`http/https`)。
- CSS 变更避免重复选择器互相覆盖。

---

## `[tika@lab ~]$ cat motion-rule.md`

- 动效走单一 `gsap.ticker`(`registerTicker`),不手写散落 rAF。
- 三档降级必须覆盖:`reduced` 终态 / `lite` 仅 fade / `full-mobile` 无 Lenis。
- 微信内置浏览器访问必须保持拦截,不可绕过主流程。

---

## `[tika@lab ~]$ cat local-dev.md`

```bash
npm install
npm run dev              # 开发
npm run build            # 构建
npm run preview          # 预览(smoke 依赖此服务)
node scripts/smoke-motion.mjs   # 冒烟测试
```

提交前检查:
- `npm run build` 通过。
- `node scripts/smoke-motion.mjs` 全绿(面板可见 / theme 翻转 / 无 console error)。
- 手动回归首页 / 项目 / 状态 / 移动端与三档降级关键行为。

---

## `[tika@lab ~]$ cat pr-policy.md`

- 提交信息使用 Conventional Commits(`feat:` / `fix:` / `refactor:`)。
- PR 写清影响范围,UI 改动附截图或录屏。
- 禁止把无关格式化混入业务修复。
