# ALp_Studio Architecture Log

### `[tika@lab ~]$ cat architecture.log`
```log
┌─ architecture.log
│ [目标] 让代码可维护，而不是可运行但不可读。
│ [核心原则]
│   01. script.js 只调度，不做业务细节。
│   02. 每个模块只做一个职责。
│   03. 移动端和桌面端分策略，不强行统一效果。
│   04. 动态渲染优先 DOM API，避免字符串拼接风险。
└─
```

---

## `[tika@lab ~]$ cat module-map.md`

### 启动与共享层
- `js/theme-bootstrap.js`
  - 预注入 `data-theme`、`data-contrast`、`data-lite`
  - 提供共享工具：`safeParseObjectJSON`、`normalizeExternalUrl`
- `js/config-loader-module.js`
  - 统一配置加载（本地/远端回退）
- `js/script.js`
  - 全站初始化调度器（错误隔离 + 执行顺序控制）

### 访问治理层
- `js/access-guard-module.js`
  - 微信内置浏览器拦截
  - 移动端首访提示（可继续访问）
  - 输出全局状态：`window.TikaAccessGuardState`

### 页面基础能力
- `js/theme-module.js`：主题切换
- `js/settings-panel-module.js`：设置读写与面板行为
- `js/clock-module.js`：日期与问候
- `js/cli-module.js`：CLI 终端

### 数据内容层
- `js/weather-module.js`：天气与氛围联动
- `js/music-module.js`：播放器 + Hitokoto 回退
- `js/home-page-extensions.js`：文章列表、滚动布局、进度条、隐藏跳转
- `js/project-list.js`：项目页渲染
- `js/status.js`：状态页渲染与刷新逻辑

### 视觉效果层
- `js/welcome-effects-module.js`：欢迎 dissolve 动画
- `js/welcome-screen-module.js`：欢迎流程控制
- `js/interactive-effects-module.js`：星空/流星/雨滴/磁吸/浮动
- `js/navigation-effects-module.js`：滚动揭示与转场

---

## `[tika@lab ~]$ cat init-order.md`

页面脚本顺序约束：
1. `theme-bootstrap` + `config-loader`
2. 功能模块
3. `access-guard-module`
4. 页面专属数据脚本（可前可后）
5. `script.js`（主页体系建议最后）

最低约束：
- `access-guard-module` 必须先于页面专属数据脚本执行。
- 页面专属脚本若先跑，必须能独立运行并读取守卫状态。

`script.js -> main()` 的最小流程：
1. `initAccessGuard()`
2. 被拦截则直接返回
3. 初始化基础模块
4. 仅桌面端开启高开销交互模块

---

## `[tika@lab ~]$ cat state.md`

存储键：
- `localStorage.theme`
- `localStorage.visualSettings`
- `sessionStorage.tika-mobile-desktop-hint`

根属性：
- `data-theme`
- `data-contrast`
- `data-lite`
- `data-weather`

---

## `[tika@lab ~]$ cat mobile-policy.md`

- 微信内置浏览器：阻断主流程。
- 其他移动设备：首访提示，但允许继续访问。
- `liteMode` 为主开关，开启后会锁定并禁用：
  - `starfield`
  - `shootingStars`
  - `raindrops`
  - `cardFloat`

---

## `[tika@lab ~]$ cat security-policy.md`

- 配置驱动内容渲染统一使用 DOM API。
- 外链统一经过 `normalizeExternalUrl` 过滤，仅放行 `http/https`。
- 避免把配置源数据直接写进 `innerHTML`。

---

## `[tika@lab ~]$ cat regression-checklist.md`

- 微信拦截是否真正阻断后续初始化
- 移动端提示是否仅首访出现
- 轻量模式是否灰化并禁用高开销项
- 文章/项目/状态加载失败时是否保留占位
- 控制台是否无初始化级报错

