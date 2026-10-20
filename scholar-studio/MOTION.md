# v18 动效说明

动效逻辑：`src/hooks/usePortfolioMotion.js`  
布局与遮罩：`src/motion.css`  
语义化标题和独立动效容器：`src/main.jsx`

## 节奏

| 区域 | 动作 | 时间 |
| --- | --- | --- |
| 首页 opening | 深蓝上下幕布分开、细线展开、冰川由横向遮罩揭开 | 总长约 3.43 秒 |
| 首页标题 | 两段文字从遮罩下进入，带位移、倾斜及纵向压缩，随后归位 | 1.75 秒，间隔 0.18 秒 |
| 模块标题 | 逐字从遮罩下大幅进入；细线、英文标识、说明随后出现 | 约 1.9 秒 |
| 人物长廊 | 介绍横向展开、长廊由中心向两边揭开并归位 | 约 2.1 秒 |
| 卡片 | 上移、轻微转正、遮罩展开 | 每张 1.65 秒，间隔 0.2 秒 |
| 项目图片 | 从较近的画幅缓慢缩回，同时保留小幅滚动视差 | 2 秒；视差平滑追随 1.2 秒 |
| 页尾文案 | 两行依次从遮罩中抬起、压缩归位 | 1.6 秒，间隔 0.16 秒 |

主要缓动为 `power4.out`；幕布与人物长廊使用 `power4.inOut` / `power3.inOut`。没有弹簧或回弹曲线。

## 交互与性能

- GSAP `3.15.0` 精确锁定；使用 Core + ScrollTrigger，不引入平滑滚动替换库。
- 原生滚动，无 pin、滚动锁或假加载进度。
- 滚轮、触摸滚动或已派发的点击可以结束 opening。不要在 `pointerdown` 阶段移动点击目标，否则目标可能在抬手时移出指针范围，使原生 click 丢失。
- 键盘聚焦使用 `:focus-visible` 判定，立即展示对应内容。鼠标焦点不强行跳到时间线末尾。
- 入场动画每次页面加载播放一次；窗口跨越断点后已完成的卡片不会重复隐藏。直接访问章节链接时跳过首页 opening。
- 动效完成后清除临时 transform、opacity、clip-path；不常驻批量 `will-change`，也不动画模糊滤镜。
- 图片视差只用于宽度至少 900px 的视口；小屏保留独立的逐卡片进场，不在第一张出现时提前播放整列。
- 视差使用独立图片容器，不干扰 BorderGlow 悬停、磨砂玻璃裁切或人物轮播内部的三维矩阵。
- `gsap.matchMedia` 跟随系统减少动态效果设置并清理时间线、ScrollTrigger 与事件；字体加载后只刷新一次几何测量。
- 动态背景原有的离屏/页面隐藏暂停策略保持；本次新增动效没有自行启动常驻 RAF 循环。

动画仍有执行与下载成本，不能保证所有设备帧率不变。生产 JS 包约 430.83 kB，Vite gzip 约 148.41 kB；相较 v17 增加约 48 kB gzip。单次入场的遮罩与现有 WebGL 背景需在最终展示电脑上一起体验。

## 复用

安装依赖后可以在 IDEA 打开本目录：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

也可使用 `npm install`、`npm run dev`。若复用到另一页面，保留 hook 中的作用域清理，按实际 DOM 修改选择器；所有核心内容默认可见，动效准备只发生在 `useLayoutEffect` 中。

官方资料：
- [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [gsap.matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/)
- [GSAP Standard License](https://gsap.com/standard-license/)；随包保留 `licenses/GSAP-NOTICE.txt` 与生产代码版权头。

## 当前性能约束

背景脚本已独立分块，Grainient 在首图解码后择空闲时段初始化，Lightfall 在学者区真正进入视口后加载；两者都有 30fps 装饰绘制上限和 150 万像素预算，不改变前景动画时钟。字体只有仍在加载时才追加一次 ScrollTrigger.refresh，避免系统字体下的重复几何测量。

文中 430.83 kB / 148.41 kB 为接入动效时的历史构建数据；当前结果和验证范围以 PERFORMANCE.md 为准。
