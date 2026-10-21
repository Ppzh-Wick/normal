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

## 当前开发检查点 · v24

2026-10-21：四行人物墙与 Lightfall、十三人人物独立专题已保存到本地仓库。点击肖像进入人物页，返回时保留筛选、暂停状态与浏览位置；详情见 [人物专题维护说明](scholar-studio/PERSON_PAGES.md)。

源码与仓库根目录的静态预览内容均为 v24。生产构建和 10 项测试通过，十三个人物页面已逐一验证。本次仅本地提交，尚未推送，公开网站仍为此前发布版本。

## 发布

完成构建后，将 scholar-studio/dist 的内容同步到仓库根目录，保留 .nojekyll、源码和 archive。
GitHub Pages 使用 main 分支根目录；经用户要求恢复发布并推送后，等待 Pages 部署成功，再打开公开网址验收。
不要将 node_modules 或本地缓存上传，不要用源码入口覆盖根目录的生产入口。
