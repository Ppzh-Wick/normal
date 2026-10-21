# 学脉相承 · 成都理工大学校史人物

React + Vite 人物专题网站。以冰川摄影、蓝青渐变、深色人物展陈和 DriftWall 流动照片墙呈现八大学者与五大学科奠基人的生平、研究与贡献。电脑浏览优先，版心最大 1700px，同时适配窄屏。

## 开发

推荐 Node.js 22 LTS 或更高版本。在 IDEA / WebStorm 中用 File → Open 打开本目录，再运行：

```sh
npm install
npm run dev
```

开发地址以终端输出为准，默认 http://127.0.0.1:5173/ 。已有 pnpm 的环境推荐使用锁文件安装：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

```sh
npm test          # 渲染预算与高刷新率调度测试
npm run build     # 生成静态网站 dist/
npm run preview   # 预览构建结果
```

修改源码后，生产预览需要重新构建。不要直接双击 index.html；它是 Vite 入口。配置以原生 ESM 加载，不需要额外配置编译步骤。

## 工程结构

| 路径 | 用途 |
| --- | --- |
| src/main.jsx | 页面结构、导航、人物选择与项目联动 |
| src/data/scholars.js | 八位学者的数据和逐人史料来源 |
| src/data/founders.js | 五位学科奠基人的数据和逐人史料来源 |
| src/components/PeopleExplorer.jsx | 十三人分组、姓名索引、照片墙及生平阅读 |
| src/components/ | 立体轮播、发光边框、动态背景与延后加载容器 |
| src/hooks/usePortfolioMotion.js | 首屏开场、章节揭示、卡片错峰与图片视差 |
| src/utils/renderBudget.js | 背景帧率与像素预算 |
| src/*.css | 基础排版、首屏、轮播、主题、玻璃与动效 |
| public/images/ | 摄影、人物肖像与专题示意图 |
| public/media/ | 早期备用校园镜头，当前页面不使用 |
| tests/ | 可直接用 Node.js 运行的测试 |
| licenses/ | 第三方组件与动画库许可 |
| CONTENT_SOURCES.md | 人物资料及素材来源 |
| MOTION.md | 动画节奏和交互约定 |
| PERFORMANCE.md | 性能预算、优化结果与验证范围 |

## 维护约定

- 冰川使用本地 WebP 的 800 / 1600 / 1920 / 2560 四档资源。更换首图时，同步修改 index.html 中的预加载和 main.jsx 中的 srcSet / sizes。
- 非人物区域沿用 Grainient，装饰绘制默认最多 30fps、150 万像素。人物区使用 DOM/CSS 3D 照片墙；本轮不再同时挂载 Lightfall，旧组件保留。GSAP 和照片墙各自管理并清理动画时钟。
- 静态页面布局独立于背景，背景初始化不会撑开内容。不支持 WebGL2 时仍可阅读全部内容。
- 人物照片墙默认持续漂移，鼠标离开后仍继续。指向肖像时按原组件行为暂停该列，其他列保持运动；“暂停流动”控制整墙。离屏、隐藏页面与减少动态效果时停止 RAF。移动端降为两列，全部人物仍可从唯一姓名索引进入。
- 系统减少动态效果时关闭入场、视差和持续背景动画。不要在 pointerdown 时移动点击目标。
- 项目图像为研究主题示意，不作为历史现场照片使用。肖像原始分辨率较低，获得高清档案照片后可替换同名文件。
- vite.config.js 从发布产物中排除未使用的原 JPEG、旧海报和旧视频；原文件保留在源码中。若恢复使用这些文件，需要同步调整排除列表。
- Git 只保存源码和资产，dist/、node_modules/、本地缓存及编辑器配置不提交。
- 每轮整体修改并验证后，将工程同步到仓库 scholar-studio/，把 dist/ 中的发布文件同步到仓库根目录；确认 GitHub Pages 部署和公开资源可用后交付，继续使用 https://ppzh-wick.github.io/normal/ 。

本项目为校史人物设计展示，非学校官方发布网站。素材出处、摄影署名和第三方版权说明随工程保留。
