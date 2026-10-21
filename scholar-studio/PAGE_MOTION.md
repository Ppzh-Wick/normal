# 页面动效 · v30

2026-10-21。用户要求先保存铜金背景，再应用 Apple Design 与 GSAP。前置检查点：6d35f5e。沿用酒红丝绸、金色人物墙和铜金 Threads，没有更换内容或素材。

## 交互

- 人物进入：新页从右侧展开，旧页轻微后退；返回使用反方向。主要滑动 0.86 秒，标题分层进入，总时长约 1.3 秒。
- 下一位与浏览器历史：按 history 导航深度判定方向，快速后退/前进先结束前一段切换。
- 返回人物墙：保持 Home 的 React 实例；保留分类、暂停状态、滚动与入口焦点。来自项目卡片时返回原项目位置。
- 章节导航：ScrollToPlugin，power3.inOut，约 0.75–1.15 秒；滚轮、触摸、按键立即接管，未接管原生滚动。
- 首页开场约 2 秒；标题整行遮罩揭开，卡片 90ms 间隔轻微缩放归位，桌面项目图约 ±2.5% 视差。已经开始的章节不在返回时重播。
- 人物章节导航不覆盖 #/people/ 路由；修改键点击保留浏览器原生行为。

## 生命周期与性能

双层切换只保留当前页和上一页；两层临时固定在视口，使用与正文等高的占位保留文档滚动长度。所有尺寸读取先于样式写入；内层 margin 仅在开始和结束写入一次，动画只改变 transform/opacity。结束时同步隐藏离场层，恢复当前层、滚动与焦点，防止闪回。快速历史切换可复用旧 React key，因此入场前显式恢复 hidden。

切换期间背景停止绘制；离场后 Home 仍保留但处于 inactive。ScrollTrigger 在最终布局稳定后启用，并在隐藏或卸载时清理。所有动画有本地 GSAP 生命周期，无全局 killTweensOf。WebGL 延续30fps、100万像素上限，不增加背景渲染预算。新增 ScrollToPlugin 来自已有 GSAP 依赖，无新增运行依赖。

prefers-reduced-motion 跳过页面位移和入场。切换中收到设置变化、窗口 resize 或用户滚动/翻页键会结束本次过渡，解除 inert 与滚动锁。页面初始脚本提前设置手动 scrollRestoration，避免刷新覆盖 #home。

## 验证

- 生产构建成功；16项测试通过，包含13人路径/资产、30fps预算、导航方向与序列化历史。
- 实际浏览器验证1440×1000桌面和390×844窄屏：分类进入/返回、下一位、快速Back/Forward、直接人物链接返回、项目入口返回、章节导航和切换中resize。
- 记录往返 scrollY=1757.33，返回相同；直接人物地址返回 #scholars 为1000。章节按钮保留人物hash，生平目标顶部约105px。
- 未发现控制台错误；未进行全设备GPU/FPS基准。系统减少动态效果分支已代码检查，未改变用户系统设置进行实测。

## 源码入口与依据

- src/components/ScholarSite.jsx、route-motion.css：路由空间切换与状态恢复。
- src/hooks/useSectionNavigation.js：章节导航。
- src/hooks/usePortfolioMotion.js、src/motion.css：首页及章节演出。
- src/components/PersonPage.jsx：人物专题动效。
- src/utils/routeTransition.js、tests/route-transition.test.mjs：方向策略与测试。
- 官方参考：[GSAP ScrollToPlugin](https://gsap.com/docs/v3/Plugins/ScrollToPlugin/)、[gsap.context](https://gsap.com/docs/v3/GSAP/gsap.context()/)。
