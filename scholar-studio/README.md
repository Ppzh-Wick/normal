当前版本 v30：铜金 Threads 已选定，用户已恢复发布授权。v29 检查点 6d35f5e；页面切换见 [PAGE_MOTION.md](PAGE_MOTION.md)。下文暂停同步和未提交表述属于历史记录。

# 学脉相承 · 成都理工大学校史人物

React + Vite 人物专题网站。本设计分支以全幅石榴红 Silk 首屏、深色人物展陈和 DriftWall 流动照片墙呈现八大学者与五大学科奠基人的生平、研究与贡献。电脑浏览优先，版心最大 1700px，同时适配窄屏。

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

## v27 人物墙本地工作样张

红色首屏已保存为本地提交4ca4037。本轮在其后继续改第二屏：暖红黑底、暖白标题、完整黑白肖像与图下姓名，移除藏蓝卡框；Lightfall暖色低亮。人物墙随宽度显示2–7列，桌面舞台820px，单项204px加24px间隙，planeScale为1。保留13/8/5筛选、暂停、人物专题和返回状态；隐藏首页时不再以0高度重置流动相位。

当前开发预览 http://127.0.0.1:4185/?v=27#scholars ，服务本工程dist。v27暂为未提交工作样张；仓库根静态产物仍保留v26，GitHub同步继续暂停。

默认展示入口为 http://127.0.0.1:4185/?v=27#home ，先展示红色丝绸头版。#scholars只用于人物墙定点检查，不作为默认预览链接。

## 2026-10-21 · v28 香槟金 Lightfall

第二屏光瀑改为更清晰的暖香槟金，继续搭配暖红黑底，保留酒红丝绸首屏、人物墙布局和原动态性能预算。当前13人均有已故证据，没有符合“健在者用彩照”的条目，因此保留黑白展示；逐人核验见 scholar-studio/PEOPLE_STATUS.md。构建、10项测试及1440桌面浏览器检查通过。默认预览 http://127.0.0.1:4185/?v=28#home ，打开先显示首屏。本轮修改尚未提交，继续暂停GitHub同步。

## v29 下方项目区背景样张

当前工程在cd50338之后新增三种React Bits背景：默认Threads铜金脉络，备用Aurora酒红曙光、DarkVeil烟铜幕光。仅选中方案懒加载；首屏和人物墙保持已确认版本。配置见src/data/researchBackgrounds.js，来源及维护见RESEARCH_BACKGROUNDS.md。默认本地入口 http://127.0.0.1:4185/?v=29#home ，备用通过ambient=aurora或ambient=darkveil参数切换。新样张尚未提交，根目录发布产物仍为v28，继续暂停GitHub同步。

## v32 项目与优势展陈

将精选项目和学者优势的厚重实心卡片改为开放式图文与横向文字展陈，加入React Bits SpotlightCard的暖铜掠光适配，不新增依赖。项目按钮、人物页返回焦点及滚动恢复保留。开发说明见EXHIBITION_CARDS.md；preview默认#home。构建及16项原有测试通过，浏览器检查1440/768/390布局与人物往返。

GitHub同步已在v29选择Threads后恢复；此前版本中的暂停描述为历史状态。
