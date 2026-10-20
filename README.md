# 学脉相承

成都理工大学八大学者人物专题。

- [开发工程](scholar-studio)：React + Vite 源码、图片资产、测试与维护说明。
- [性能记录](scholar-studio/PERFORMANCE.md)：资源体积、背景渲染预算与验证范围。
- [内容来源](scholar-studio/CONTENT_SOURCES.md)：人物史料、摄影和组件许可。

## 本地开发

```sh
git clone https://github.com/Ppzh-Wick/normal.git
cd normal/scholar-studio
npm install
npm run dev
```

推荐 Node.js 22 LTS 或更高版本。使用 IDEA 时打开 scholar-studio 文件夹。

`npm test` 运行测试；`npm run build` 生成 dist；`npm run preview` 预览构建。
根目录 index.html 为当前已发布页面。新开发工程位于 scholar-studio，发布时使用其构建产物。
