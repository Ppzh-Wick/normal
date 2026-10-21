# 内容与素材来源

- v17 卡片与控件边框：改编自 [React Bits BorderGlow](https://www.reactbits.dev/components/border-glow)，作者 David Haz。2026-10-20 下载[官方 JSX](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/BorderGlow/BorderGlow.jsx)、CSS 和仓库许可。下载记录及 SHA-256 在 `BORDER_GLOW_SOURCE.json`；完整许可为 `licenses/React-Bits-BorderGlow-LICENSE.md`，dist 同时附带。保留官方归一化边缘距离、指针角度、网格渐变和阴影颜色计算，适配原生元素、既有浅色/玻璃表面、键盘焦点及动画清理。没有增加远程运行依赖。

- v15 首页及非学者区域背景：改编自 [React Bits Grainient](https://www.reactbits.dev/backgrounds/grainient)，作者 David Haz。2026-10-20 下载[官方 JavaScript 源码](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/Grainient/Grainient.jsx)及 CSS，采用用户指定的四种蓝青颜色和参数。下载文件哈希见 `GRAINIENT_SOURCE.json`；完整许可为 `licenses/React-Bits-Grainient-LICENSE.md`，静态构建同时附带。保留原 WebGL2 着色器，增加 React 导入、可见区域暂停、前景交互过滤和动态效果偏好监听。

- v14 学者背景：改编自 [React Bits Lightfall](https://www.reactbits.dev/backgrounds/lightfall)，作者 David Haz。2026-10-20 下载[官方 JavaScript 源码](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/Lightfall/Lightfall.jsx)及 CSS，使用用户指定的蓝色参数。原始源码哈希与下载地址见 `LIGHTFALL_SOURCE.json`；完整许可为 `licenses/React-Bits-Lightfall-LICENSE.md`，静态构建附带同一许可。保留官方 WebGL2 光束与辉光算法，仅适配 React 导入、前景指针交互、窗口失焦及动态效果偏好监听。

- v11 三维轮播：改编自 [React Bits CircularCarousel](https://www.reactbits.dev/components/circular-carousel?cardWidth=242)，作者 David Haz。官方源码提交 `e12c22192ac7b4b452c5e2feb9b586d74765d696`，采用 MIT + Commons Clause；完整许可随工程保存在 `licenses/React-Bits-LICENSE.md`。复用原组件的 CSS 3D 弯曲卡片和交互，并适配中文、人物索引与档案联动。

- 学者生平、研究方向与贡献：`src/data/scholars.js` 每人 `sources` 字段，包含成都理工大学公开人物史料链接。
- 八位肖像与校园夜景：成都理工大学[官方宣传册](https://www.cdut.edu.cn/__local/5/A4/EC/6A374FB2B6D5E59BE636581520D_23F23F7F_C709C9.pdf)。肖像取自印刷页 07—08，夜景取自 PDF 第 4 页原始嵌入图片。
- `hero-campus.mp4`：以上述校园夜景制作的无声缓慢移动镜头；不是原始校园实拍视频。
- 三张“精选项目”图片：本项目原创 SVG 信息示意图。它们说明研究主题，不是历史现场或实际手稿的影像。
- v06 首屏冰川摄影：Danny Rienecker，[Icebergs floating in a glacial lagoon with mountains behind](https://unsplash.com/photos/icebergs-floating-in-a-glacial-lagoon-with-mountains-behind-9v9uIJKEhDY)，地点为冰岛 Jökulsárlón。原始下载保留在项目 `assets/glacier/`，网页同内容副本为 `public/images/hero-glacier.jpg`（2560×1707）。2026-10-20 核对 [Unsplash License](https://unsplash.com/license)，允许下载及免费用于商业和非商业用途。网页页脚保留摄影署名与来源链接。
- 首屏图片只通过网页 CSS 等比例裁切、亮度与饱和度调整展示，未生成或重绘冰川。图片是主题视觉，不作为学者考察史料使用。

本网页为设计展示原型，并非学校官方发布网站。使用其他地方的图片或文字前请自行核对授权与出处。

## 响应式图片与性能处理

首屏 WebP 派生自同一张摄影原图：800、1600、1920、2560px 四档，仅缩放和压缩；400px 装饰副本用于已有的 CSS 边缘柔化。未替换摄影内容。原 JPEG、旧海报、备用视频保留在源码，当前静态构建不包含这三项。

动态背景增加延后加载、像素预算、30fps 调度、可见面积判断和指针事件合并；BorderGlow 共用全局复位监听。上文原件哈希用于核对下载来源，组件源码在此基础上进行了本地适配。

## v21 十三人人物墙

- 照片墙改编自 [React Bits DriftWall](https://www.reactbits.dev/components/drift-wall)，官方源码提交 `e12c22192ac7b4b452c5e2feb9b586d74765d696`。保留倾斜、交错漂移、指针视差和浮起效果，适配人物档案、持续播放控制、唯一键盘索引、离屏停止与减少动态效果。源文件与适配哈希见 `DRIFT_WALL_SOURCE.json`，完整许可随 `licenses/react-bits-drift-wall-LICENSE.md` 分发。
- 五位学科奠基人：刘宝珺、曾允孚、张倬元、罗蛰潭、金景福。分组与姓名依据学校官方宣传册印刷09—10页；对应八大教授为印刷07—08页。
- 五人肖像及简要生平来源见 `FOUNDERS_SOURCES.json` 和 `src/data/founders.js`。原照片未重绘；张倬元和金景福肖像来自低分辨率画册，后续可换同名高清档案。
- 本轮仅加入有一手出处的简要经历；完整传记仍待后续正式资料。未充分核实的完整生卒年保持空值。
