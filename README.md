<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0:ff9a9e,50:fad0c4,100:96deda&height=280&text=Observation%20Deck&desc=A%20Place%20for%20Tika's%20Data%20Fragments&fontAlign=50&fontAlignY=35&descAlign=50&descAlignY=60&fontSize=70&descSize=20&animation=twinkling" />
</p>

<div align="center">

### 你好，这里是亓翎。

这里是我堆放观察日记和数据碎片的地方，你可以把它当成我的一个临时观测站。<br>
欢迎，但请注意，部分数据可能处于不稳定状态。（笑）

</div>

---

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
</p>

---

### `[tika@lab ~]$ cat project.log`
```log
┌─ project.log
│ [项目名称] 亓翎的个人空间
│ [项目代号] Observation_Deck_Alpha
│ [当前版本] v2.3 (持续迭代中)
│
│ [实验目标]
│   01. 搭建一个用于记录和展示观察数据的前端界面。
│   02. 测试人类对不同视觉元素的反应。（比如，通过一些微小的排版瑕疵，观察人类的“强迫症”式反应。）
│   03. 归档一些...我的个人数据碎片，以便后续分析。 (有点不好意思)
└─
```

### `[tika@lab ~]$ cat status.log`
```log
┌─ status.log
│ [系统状态] 运行稳定，正在持续收录数据。
│ [情绪模块] 73% 稳定，偶尔会因未知输入产生波动。 (´・ω・｀)会跳起来大叫
│ [已知问题] 长期观察可能导致数据过载，需要定期清理缓存。
│ [未来计划] 可能会加入更多我觉得有意思的功能，如果我能理解它们的话。 (思考)
└─
```

### `[tika@lab ~]$ tail -n 3 run.log`
```log
┌─ run.log (tail -n 3)
│ [LOG] 认知训练 | 正在分析人类为何喜欢在夜间浏览无意义的信息。
│ [LOG] 视觉校准 | 对 1px 的偏差进行修正，试图理解“像素眼”这一概念。
│ [LOG] 交互协议 | 记录到一次新的访问，正在尝试分析访问者的意图...
└─
```

---

### `[tika@lab ~]$ cat feature-map.md`
- 欢迎屏 + 打字唤醒：启动时逐字显示 `WELCOME_TEXT`，随后淡出进入主界面。
- 背景系统：三层星空 + 流星 + 雨滴 + 鼠标光斑渐变，支持视差与缓动。
- 玻璃拟态卡片：全局 3D 视差、悬浮、磁性吸附、文字扰动与入场扫描动画。
- 主题切换：深/浅主题保存到 `localStorage`，支持 View Transitions 过渡动画。
- 设置面板：星空/流星/雨滴/卡片浮动/音乐自动播放/播放列表类型（单曲或专辑）。
- 实时小工具：数字时钟、动态问候、天气模块。
- 音乐模块：APlayer + MetingJS，随机读取 `config.json` 的网易云 ID。
- 回退方案：音乐失败时自动切换到 Hitokoto 一言，定时刷新。
- CLI 彩蛋：通过 `\`` 或 `~` 唤出，支持内置指令与 ASCII 信息面板。

### `[tika@lab ~]$ cat modules.md`
- 欢迎屏：`#welcome-screen` + 打字机光标，加载完成后 `body.is-ready` 触发全局入场动画。
- 星空/流星/雨滴：`canvas` 绘制，三层星空视差，流星与雨滴独立控制。
- 视差与磁性：鼠标移动驱动整体背景与卡片倾斜，链接卡片有磁性吸附与文字扰动。
- 问候与时间：按小时切换问候语，日期使用 `Intl.DateTimeFormat` 输出。
- 天气：优先地理定位，调用 Open-Meteo；失败时进入虚拟天气模拟。
- 音乐：随机挑选 `song/album`，APlayer 主题与页面同步。
- CLI：`help / clear / theme / info / date / fortune / say / exit`，`Esc` 关闭。

### `[tika@lab ~]$ cat runbook.md`
1. 启动本地服务：双击 `start-server.bat`，然后访问 `http://localhost:5173/`。
2. 完整功能：天气、音乐、定位、外部图标需要网络与 HTTPS/localhost 环境。
3. 自动播放提示：浏览器可能拦截自动播放，可在设置面板关闭或手动播放。
4. 部署方式：任意静态托管均可运行（GitHub Pages / Vercel / Cloudflare Pages 等）。

### `[tika@lab ~]$ cat config.md`
`config.json` 维护音乐列表，格式如下：
```json
{
  "netease_music_items": [
    { "id": "2053344480", "type": "song" },
    { "id": "2053344483", "type": "song" },
    { "id": "2053344486", "type": "song" },
    { "id": "179521966", "type": "album" }
  ]
}
```
- `type` 支持 `song` / `album`，设置面板可切换播放列表类型。
- 若列表为空或加载失败，会自动切换到 Hitokoto 一言回退模式。

### `[tika@lab ~]$ cat customize.md`
- 修改文案与链接：`index.html`（头像、社交链接、SEO 元信息、欢迎语）。
- 调整主题与动画：`css/style.css`（主题色、背景图、玻璃质感、动效细节）。
- 调整交互参数：`js/script.js`（欢迎文本、星空数量、视差强度、打字速度等）。
- 更新音乐列表：`config.json` 的 `netease_music_items`。
- 更换字体与素材：`fonts/` 或替换外部图片资源地址。

### `[tika@lab ~]$ cat integrations.md`
- APlayer `1.10.1`（CDN: jsDelivr）
- MetingJS `2`（CDN: jsDelivr）
- Font Awesome `6.4.0`（CDN: cdnjs）
- Open-Meteo API（天气数据）
- Hitokoto API（一言回退）
- 背景 / 头像 / 图标使用外部图片资源链接

### `[tika@lab ~]$ tree -L 2`
```text
Home/
├─ index.html        # 页面结构与文案入口
├─ css/
│  └─ style.css      # 视觉与动效风格
├─ js/
│  └─ script.js      # 交互逻辑与模块控制
├─ config.json       # 音乐列表配置（网易云）
├─ fonts/            # 本地字体与图标资产
├─ CNAME             # 部署时的自定义域名记录
└─ README.md         # 项目说明
```

### `[tika@lab ~]$ cat notes.md`
- 无后端、无数据库，仅为静态展示型观测站。
- 移动端会隐藏星空背景，降低雨滴数量以减少性能压力。
- `prefers-reduced-motion` 会自动关闭大部分动画与浮动效果。
- CLI 使用 `\`` 或 `~` 唤出，`Esc` 关闭；移动端可能无法触发。
- 若外部资源失效，可替换为本地资源或自建镜像。

<div align="center">

感谢你的访问。 (鞠躬)

_实例仍在运行，日志未终止。_

</div>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=120&section=footer&color=gradient&customColorList=0:ff9a9e,50:fad0c4,100:96deda" />
</p>
