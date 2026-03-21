# 前端结构规范（2026-03）

## 目标
- `js/script.js` 仅负责调度与初始化顺序，不承载大体积业务实现。
- 每个模块只处理单一职责，避免“效果逻辑堆砌在一个文件”。

## 模块分层
- 启动与共享：
  - `js/theme-bootstrap.js`：首屏主题与视觉设置预加载。
  - `js/config-loader-module.js`：统一 `config.json` 加载（本地/远端回退）。
  - `js/script.js`：初始化调度与模块桥接。
- 页面基础能力：
  - `js/access-guard-module.js`：微信内置浏览器拦截与移动端访问提示。
  - `js/theme-module.js`：主题切换与过渡动画。
  - `js/clock-module.js`：时钟与问候语。
  - `js/settings-panel-module.js`：视觉设置面板。
  - `js/cli-module.js`：CLI 交互终端。
- 内容与数据：
  - `js/weather-module.js`：天气与氛围状态。
  - `js/music-module.js`：音乐播放器与 Hitokoto 后备卡片。
  - `js/home-page-extensions.js`：文章列表、滚动布局、进度条、隐藏跳转。
  - `js/project-list.js`：项目列表页渲染。
  - `js/status.js`：状态页数据渲染。
- 视觉效果：
  - `js/welcome-effects-module.js`：欢迎页低多边形溶解动画。
  - `js/welcome-screen-module.js`：欢迎页文案流程与主界面揭示。
  - `js/interactive-effects-module.js`：星空/流星/雨滴/磁吸/倾斜等交互。
  - `js/navigation-effects-module.js`：滚动揭示与页面转场。

## 初始化顺序约束
- HTML 中脚本顺序固定为：
  1. `theme-bootstrap` + `config-loader`
  2. 业务模块
  3. `script.js`（最后）
- 若新增模块，必须在 `script.js` 执行前加载。

## 扩展规范
- 新功能优先新增模块，不直接堆入 `script.js`。
- 跨页面共享能力优先写入共享模块，避免重复请求与重复解析逻辑。
- 所有动态渲染优先使用 DOM API，避免未转义的 HTML 拼接。
