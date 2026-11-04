# 李承三 · 实验2 · 矿色雾面

以 V7 为基础的独立背景与材质升级。接入真实 React Bits Grainient 颗粒渐变和 GlassSurface 磨砂展签，保留人物介绍、24 个圆形关系节点及分类、完整史料、V7 翻页转场与所有旧版本。

## Run and verify

```
npm ci
npm test
npm run build
node scripts/build-standalone.mjs
```

公开预览目录：`previews/experiment-2/`；源代码：`experiments/experiment-2/`。单文件输出：`../李承三-实验2-矿色雾面.html`。

组件上游来源、适配与许可见 `docs/V8-MATERIALS.md`；测试和浏览器/GPU 验证边界见 `V8-VERIFICATION.md`。移动端与无 WebGL 时使用同一 Grainient shader 的静态渲染底图；底图不冒充浏览器实时 GPU 渲染。

历史图片来源与许可状态保留。公开可见不等于可自由复用；未经公开的年谱 PDF 不随站点发布。数学地形是装饰，不是历史路线复原。
