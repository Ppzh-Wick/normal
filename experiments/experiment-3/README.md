# 李承三 · 实验2 · 星河学脉

在矿色雾面实验2之上，仅为“学脉相连”接入真实 React Bits Galaxy。深群青、银蓝星点和青蓝极光弧带与紫色云海营造安静的纪念氛围。星河是装饰意象，不是历史坐标或事实陈述。人物资料、24个圆形节点、分类、证据与原始图像均保留。

## Run and verify

```
npm ci
npm test
npm run build
node scripts/build-standalone.mjs
```

公开预览：`previews/experiment-2/`；源代码：`experiments/experiment-2/`。原矿色预览原样另存于 `previews/experiment-2-mineral/`。单文件输出：`../李承三-实验2-星河学脉.html`。

Galaxy 的原始 shader 保留；默认静止一帧，关闭穿越、闪烁、旋转、交互扰动。手机与减少动态模式不创建 Galaxy canvas；无 WebGL 时使用同一 shader 原生离屏生成的静态 WebP。旧首页的真实 Grainient 和小面积 GlassSurface 维持原样。

组件来源、许可、性能适配、测试边界见 `docs/V9-GALAXY.md`。前轮材质与转场说明仍保留。历史图片与文字依据不变；未公开年谱 PDF 不随站点发布。
