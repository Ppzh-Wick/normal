# 学脉相承

成都理工大学八大学者与五大奠基人人物专题，React + Vite 工程。

- 公开访问：https://ppzh-wick.github.io/normal/?v=30#home
- 开发源码：`scholar-studio/`；在 IDEA 中打开这个目录。
- 发布产物：根目录 `index.html`、`assets/`、`images/`、`fonts/`、`licenses/`。
- 历史备份：`archive/v04/`。

## 当前版本 · v30

酒红 Silk 首屏、香槟金 Lightfall 人物墙、铜金 Threads 项目区。人物墙提供八大学者、五大奠基人十三个独立专题。主选背景是 Threads，Aurora 与 DarkVeil 作为查询参数备用方案按需加载。

页面使用 GSAP 实现方向一致的展开/返回、整行标题揭开、卡片依次归位和章节滚动。返回保留人物分类、暂停状态、滚动位置与键盘焦点。普通滚轮保持原生；减少动态效果时跳过切换。详见 [动效说明](scholar-studio/PAGE_MOTION.md)。

v29 铜金配色检查点为 `6d35f5e`。用户于 2026-10-21 选择 Threads 并要求发布，覆盖此前暂停 GitHub 同步的指示。

## 本地开发

```sh
git clone https://github.com/Ppzh-Wick/normal.git
cd normal/scholar-studio
npm install
npm run dev
```

建议 Node.js 22 LTS 或更高版本。`npm test` 运行测试，`npm run build` 构建，`npm run preview` 预览。

## 发布与维护

GitHub Pages 使用 main 分支根目录。构建后同步 scholar-studio/dist 到根目录，清理旧的构建哈希文件，保留 .nojekyll、源码和 archive。不要提交 node_modules、缓存或凭据。推送后核对 Pages 产物哈希与公网交互。

维护资料：[工程说明](scholar-studio/README.md)、[背景配色](scholar-studio/RESEARCH_BACKGROUNDS.md)、[性能](scholar-studio/PERFORMANCE.md)、[人物专题](scholar-studio/PERSON_PAGES.md)、[内容来源](scholar-studio/CONTENT_SOURCES.md)、[人物状态核验](scholar-studio/PEOPLE_STATUS.md)。

本项目是校史人物设计原型，非学校官方发布网站。肖像和内容来源、第三方许可随工程保留。

