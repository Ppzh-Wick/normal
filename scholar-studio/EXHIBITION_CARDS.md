# v32 · 开放式图版与暖铜掠光

两节范围：精选项目、学者优势。沿用现有人物、研究描述、三幅主题SVG和所有路由行为。

- 项目采用一幅横向主图版与两幅并列图版；取消实心卡框、彩色描边和圆形箭头底。
- 优势采用四行宋体标题与正文，对齐于同一版心。
- React Bits Spotlight Card派生组件：src/components/ExhibitSpotlight.jsx / .css。
- 暖墨红 #171114、暖白 #f7f2ef、铜金 #c9ab86。指针掠光为 #d1b394，静态最高10%不透明度，仅交互时显示。
- 无新运行依赖，无全局pointermove监听和常驻动画循环；每次指针移动至多调度一帧，离开、页面隐藏、媒体条件变化和卸载均清理。
- 触屏、减少动态效果时使用静态图文；所有正文默认可见。
- 既有GSAP改为逐条触发，避免纵向项目提前播完；图片入场与滚动视差仍独立于光照层。

来源：https://reactbits.dev/components/spotlight-card
源码：https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/SpotlightCard/SpotlightCard.jsx
许可证：public/licenses/React-Bits-Backgrounds-LICENSE.md（MIT + Commons Clause）。

默认访问首页：http://127.0.0.1:4185/?v=32#home
