# 李承三 · 实验3 · 关系回响

基于已单独保存的实验2聚焦版本，探索有限的关系描线、节点回响、证据纸面展开和章节纵深转场。原实验2不覆盖。

公开预览：`previews/experiment-3/`；源代码：`experiments/experiment-3/`。原聚焦版：`previews/experiment-2/`，Git分支：`experiment-2-pair-focus`。原矿色版：`previews/experiment-2-mineral/`。

## Run and verify

```
npm ci
npm test
npm run build
node scripts/verify-pair-focus.mjs
node scripts/verify-relation-motion.mjs
```

浏览器测试需先安装Playwright和Chromium。动作与降级说明见 `docs/EXPERIMENT-3.md`，最终验收以CI结果和浏览器截图为准。

24个节点、分类、史料、图片、青蓝极光与紫色云海保持原样。Galaxy的默认静帧、Grainient与GlassSurface的来源与许可仍保留于原文档。新增关系动效为原创，不声称来自Active Theory或React Bits。未公开年谱PDF不随站点发布。
