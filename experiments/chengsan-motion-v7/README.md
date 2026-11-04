# 李承三 · 山河之间 · V7 翻页叙事实验

V6 配色的独立动效升级。保留人物介绍、24 个圆形关系节点与分类、完整史料和原图，不覆盖旧作业、优化版、V5 或 V6。

## Run and verify

```
npm ci
npm test
npm run build
node scripts/build-standalone.mjs
```

源站为相对路径静态 Vite 构建；公开预览目录为 `previews/chengsan-motion-v7/`，源代码为 `experiments/chengsan-motion-v7/`。单文件输出为 `../李承三-山河之间-翻页叙事实验.html`。

实际 React Bits 接入：SplitText、AnimatedContent、原生 dialog 适配的 StaggeredMenu。页面翻页是自定义 View Transition。具体上游来源、修改和许可见 `docs/V7-MOTION.md`，测试边界见 `V7-VERIFICATION.md`。

历史图片来源和许可状态均保留。公开可见不等于可自由复用；未经公开的年谱 PDF 不随站点发布。数学地形是装饰，不是历史路线或地形复原。
