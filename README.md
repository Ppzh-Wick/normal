# 学脉相承

成都理工大学八大学者与五大奠基人人物专题，React + Vite 工程。

- 公开访问地址：https://ppzh-wick.github.io/normal/
- `scholar-studio/`：开发源码、原始资产、测试与维护文档。
- 根目录 `index.html`、`assets/`、`images/`、`licenses/`：生产构建，用于 GitHub Pages。
- `archive/v04/index.html`：此前公开页面的原始备份。

## 本地开发

```sh
git clone https://github.com/Ppzh-Wick/normal.git
cd normal/scholar-studio
npm install
npm run dev
```

推荐 Node.js 22 LTS 或更高版本。在 IDEA 中打开 scholar-studio 文件夹。

`npm test` 运行测试，`npm run build` 生成 dist，`npm run preview` 预览构建。
维护说明见 [工程 README](scholar-studio/README.md)、[性能记录](scholar-studio/PERFORMANCE.md) 和 [内容来源](scholar-studio/CONTENT_SOURCES.md)。

## 此前设计检查点 · v26

`design/plum-silk-hero` 基于 v24 检查点 `559b5dc`。首屏为克制的石榴红 Silk 与暖白中文标题，保留左下排版、玻璃按钮及十三人人物专题。Silk speed 2.4，首屏可见时持续流动，离屏自动暂停。说明见 [首屏维护记录](scholar-studio/HERO_SILK.md)。本地预览 http://127.0.0.1:4185/?v=26.1#home 。仅本地保存，未推送或发布，主分支检查点及旧预览保留。

## 此前检查点 · v24

2026-10-21：四行人物墙与 Lightfall、十三人人物独立专题已保存到本地仓库。点击肖像进入人物页，返回时保留筛选、暂停状态与浏览位置；详情见 [人物专题维护说明](scholar-studio/PERSON_PAGES.md)。

该检查点生产构建和 10 项测试通过，十三个人物页面已逐一验证。当前设计分支的源码与根目录静态产物更新为 v26。公开网站仍为此前发布版本。

## 发布

本地工作区另有v27人物墙样张：暖红黑底、无框黑白肖像、图下姓名及暖色Lightfall。预览 http://127.0.0.1:4185/?v=27#scholars 服务scholar-studio/dist。该样张尚未提交；根目录静态产物仍是红色首屏检查点4ca4037。继续暂停GitHub发布。

完成构建后，将 scholar-studio/dist 的内容同步到仓库根目录，保留 .nojekyll、源码和 archive。
GitHub Pages 使用 main 分支根目录；经用户要求恢复发布并推送后，等待 Pages 部署成功，再打开公开网址验收。
不要将 node_modules 或本地缓存上传，不要用源码入口覆盖根目录的生产入口。

## 当前设计检查点 · v28

酒红 Silk 首屏、十三人无框人物墙与香槟金 Lightfall 已完成，人物专题路由和返回状态保留。13人在世状态核验见 [PEOPLE_STATUS.md](scholar-studio/PEOPLE_STATUS.md)。本轮将源码与36个静态构建文件一并保存。构建和10项测试通过。默认预览 http://127.0.0.1:4185/?v=28#home 。仅本地 Git 保存，继续暂停 GitHub 同步。前文v27未提交状态为历史记录。

