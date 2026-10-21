# 紫色丝绸首屏 · v25

2026-10-21，分支 `design/plum-silk-hero`，基于 v24 检查点 `559b5dc`。仅本地开发，未推送或部署。

## 范围与布局

按用户提供的 Apple 首屏参考保留左下大标题，上方及整个首屏交给 Silk 动态材质。去除冰川图层与首屏蓝青背景；主色为深梅紫，亮面为银紫，文字为温白。说明文字移到标题下，右下保留玻璃探索按钮，新增独立暂停控制。

只调整首屏与首屏导航：原四行十三人人物墙、Lightfall、分组、独立人物页、返回状态、项目与学者优势继续保留。不会将抽象丝绸说成历史场景。页面仍明确标记设计原型。

## 参数与文件

- 主色 `#725078`，亮面 `#e2d3e8`，无 WebGL 时静态底色 `#100c16`，主文字 `#f6f3f8`。
- Silk：speed 0.65、scale 1.2、rotation 0.25、noiseIntensity 0.3、sheen 0.7、depth 0.62、glow 0.03、ripple 1.1、wave 0.8、variation 0。关闭鼠标扭曲、点击波纹和组件自身 intro；首屏统一交给 GSAP 揭幕。
- `src/hero-silk.css`：局部主题、响应式、字体、玻璃按钮和焦点。
- `src/components/Silk.jsx`：保留官方 shader，加入项目渲染预算、隐藏/离屏暂停与上下文恢复。
- `src/components/DeferredBackground.jsx`：独立延迟加载 Silk，未到达浅色模块时不加载 Grainient。
- `public/fonts/noto-sans-sc-hero-variable.woff2`：Noto Sans SC 100–900 可变字重，189 字符，39,004 bytes；首屏标题 730。OFL 许可与来源清单随仓库保留。
- `index.html`：首页加载字体子集；直接访问人物页不抢先加载首页字体。生产 CSS 使用相对字体路径，兼容 GitHub Pages 子目录。

## 来源

- [React Bits Silk](https://reactbits.dev/backgrounds/silk)。官方仓库 DavidHDev/react-bits，来源提交 `e12c22192ac7b4b452c5e2feb9b586d74765d696` 的 `public/r/Silk-JS-CSS.json`。保留 MIT + Commons Clause 许可，见 licenses/React-Bits-Silk-LICENSE.md。
- 字体来源、哈希及完整字集见 public/fonts/FONT_SOURCE.json；许可见 licenses/NotoSansSC-OFL.txt。
- 原肖像、史料、冰川原始文件及署名记录保留，未重绘人物或生成替代照片。

## 验证与限制

- 生产构建及原有 10 项路由/高刷预算测试通过。首次运行发现官方 JSX 缺少本工程经典 JSX 转换所需的 React 导入，已修复并在浏览器验证。
- 实际浏览器检查 1440×900、768×1024、390×844；首屏无水平溢出、标题桌面一行/手机两行；导航与标题对齐，手机菜单可开关。
- 字体实际加载成功。1440×900 主画布 1258×794，低于 100 万像素；绘制由现有 30fps gate 限制，不等于实测保证任意设备 30fps。
- 暂停/继续按钮改变运行状态；进入人物页或离开首屏后 Silk 为 paused，返回首页恢复运行。首屏初次挂载不加载 Grainient。
- 开始探索可到人物墙；五大奠基人筛选、刘宝珺独立页与返回筛选保持已实测。13 人数据及其余内容未修改。
- 减少动态、标签页隐藏、WebGL 不可用及恢复路径经过代码审查；本轮未用浏览器强制模拟上下文丢失或系统减少动态设置。
- 旧版源目录及端口 4173 保留；本分支预览 http://127.0.0.1:4185/?v=25#home 。后续编辑以此仓库的 scholar-studio 为准，修改后重新构建预览。

## 视觉验收

本轮为用户明确指定方向的单一首屏改版，按 taste skill 单组件例外跳过随机抽取方向。紫色、玻璃、学校说明在标题上方均遵循用户要求；保留模块不受本轮全面换风格。使用受支持的应用浏览器截图检查，未运行会另起 CDP 浏览器的 inspect.mjs；不宣称通过它的自动门禁。静态 lint 仍保留全站遗留风格命中，详见项目 docs/紫色丝绸首屏-v25.md。
