# Repository Guidelines

### `[tika@lab ~]$ cat repo-policy.log`
```log
┌─ repo-policy.log
│ [项目类型] 纯静态站点（无后端 / 无数据库）
│ [维护目标] 模块清晰、结构稳定、禁止回退成堆砌式脚本
└─
```

---

## `[tika@lab ~]$ cat layout.md`

页面：
- `index.html`
- `ProjectList/index.html`
- `status/index.html`
- `maintenance/index.html`
- `404.html`

样式：
- `css/style.css`
- `css/style-enhanced.css`

脚本（核心）：
- `js/theme-bootstrap.js`
- `js/config-loader-module.js`
- `js/access-guard-module.js`
- `js/script.js`

脚本（功能）：
- 其余 `*-module.js` 与页面脚本按职责拆分，不并回大脚本。

---

## `[tika@lab ~]$ cat script-order.md`

推荐顺序：
1. `theme-bootstrap` + `config-loader`
2. 业务模块
3. `access-guard-module`
4. 页面专属脚本（可选）
5. `script.js`

硬约束：
- `access-guard-module` 必须早于页面专属数据脚本。
- 页面专属脚本若早于 `script.js`，必须可单独运行并读取守卫状态。

---

## `[tika@lab ~]$ cat code-style.md`

- JS 使用 IIFE 模块风格，减少全局污染。
- `script.js` 只负责调度，不接受业务细节回填。
- 动态内容渲染优先 DOM API。
- 外链统一走协议白名单过滤（`http/https`）。
- CSS 变更采用最小改动原则，避免重复选择器互相覆盖。

---

## `[tika@lab ~]$ cat mobile-performance.md`

- 移动端默认降低高开销特效。
- `liteMode` 为性能主开关，开启后应锁定并禁用高开销项。
- 微信内置浏览器访问必须保持拦截，不可绕过主流程。

---

## `[tika@lab ~]$ cat local-dev.md`

启动方式：
```bash
start-server.bat
```
或：
```bash
python -m http.server 5173
```

预览地址：
- `http://localhost:5173/`

提交前检查：
- `node --check js/*.js`（按当前 shell 展开）
- 手动回归主页/项目/状态/移动端关键行为

---

## `[tika@lab ~]$ cat pr-policy.md`

- 提交信息建议使用 Conventional Commits（`feat:` / `fix:` / `refactor:`）。
- PR 需写清影响范围，UI 改动附截图或录屏。
- 禁止把“无关格式化”混入业务修复。

