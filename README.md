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

## 发布

完成构建后，将 scholar-studio/dist 的内容同步到仓库根目录，保留 .nojekyll、源码和 archive。
GitHub Pages 使用 main 分支根目录；提交后等待 Pages 部署成功，再打开公开网址验收。
不要将 node_modules 或本地缓存上传，不要用源码入口覆盖根目录的生产入口。
