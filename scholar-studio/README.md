# 学脉相承 · 成都理工大学校史人物

React + Vite 人物专题网站。本设计分支以全幅紫色 Silk 首屏、深色人物展陈和 DriftWall 流动照片墙呈现八大学者与五大学科奠基人的生平、研究与贡献。电脑浏览优先，版心最大 1700px，同时适配窄屏。

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
| src/components/PeopleExplorer.jsx | 十三人分组、姓名索引与照片墙入口 |
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

- v25 首屏使用 React Bits Silk，参数在 main.jsx，主题在 hero-silk.css。字体为本地 Noto Sans SC 可变字重子集，39 KB；修改文案时检查 FONT_SOURCE.json 的字集。原冰川资料保留在源码，但不渲染、不预加载、不进入生产产物。
- 首屏 Silk 和人物区 Lightfall 分别限制为 30fps、100 万像素。其余浅色模块沿用 Grainient，默认最多 30fps、150 万像素；只有滚动到浅色模块才加载。照片墙采用 DOM/CSS 3D。GSAP、背景和照片墙各自管理并清理动画时钟。
- 静态页面布局独立于背景，背景初始化不会撑开内容。不支持 WebGL2 时仍可阅读全部内容。
- 人物照片墙默认持续漂移，鼠标离开后仍继续。指向肖像时按原组件行为暂停该列，其他列保持运动；“暂停流动”同时控制整墙与 Lightfall。离屏、隐藏页面与减少动态效果时停止持续 RAF。桌面采用约四行的横向肖像卡，照片完整包含、姓名独立排版；移动端降为两列，全部人物仍可从唯一姓名索引进入。
- 系统减少动态效果时关闭入场、视差和持续背景动画。不要在 pointerdown 时移动点击目标。
- 项目图像为研究主题示意，不作为历史现场照片使用。肖像原始分辨率较低，获得高清档案照片后可替换同名文件。
- vite.config.js 从发布产物中排除全部冰川 WebP、原 JPEG、旧海报和旧视频；原文件保留在源码中。若恢复使用这些文件，需要同步调整排除列表。
- Git 只保存源码和资产，dist/、node_modules/、本地缓存及编辑器配置不提交。
- 2026-10-21 用户明确暂停 GitHub 同步。v22 起先在本地迭代和验证，预览 http://127.0.0.1:4173/?v=22#scholars 。恢复同步须等用户新指示；公开站点暂保留 v21。将来发布仍使用原仓库 scholar-studio/ 源码、根目录静态产物和原 GitHub Pages 地址。

本项目为校史人物设计展示，非学校官方发布网站。素材出处、摄影署名和第三方版权说明随工程保留。

## v24 人物独立专题

人物墙入口改为 `#/people/人物ID` 独立页面，移除旧的 `#scholar-profile` 内联简介。当前本地预览 `http://127.0.0.1:4173/?v=24#scholars`，继续暂停 GitHub 同步。

- `src/components/ScholarSite.jsx`：轻量 Hash 导航，保存/恢复筛选、滚动和焦点。
- `src/components/PersonPage.jsx` 与 CSS：人物专页，玻璃导航、贡献、生平、史料、连续阅读。
- `src/data/people.js`：统一十三人数据入口，继续引用原有 scholars/founders。
- `src/utils/personRoutes.js`：路由解析与链接点击规则；测试在 tests/person-routes.test.mjs。
- 进入人物页时暂停隐藏首页的所有装饰动画，GSAP 只维护当前页面；直接访问人物页不初始化首页背景与冰川预加载。减少动态效果条件变化与卸载均清理动画监听。

专题维护与验证说明见 [PERSON_PAGES.md](PERSON_PAGES.md)。更新人物资料仍编辑原始数据文件，人物墙与专题共享同一来源。
