# 实验3 · 关系回响

状态：构建与测试已完成，独立 Git 版本已保存。GitHub Pages 尚未发布，以下实验3网址为计划地址。

独立预览：https://ppzh-wick.github.io/normal/previews/experiment-3/
源代码：experiments/experiment-3/
保留分支：experiment-3-relation-reveal

原实验2和聚焦快照 experiment-2-pair-focus 保持不变。

## 这版新增

- 选择一段关系时，仅此关系单次描线、回响圈与证据线展开，最长720ms，完成后释放动画。
- 证据纸面轻微展开，关闭控件不移动。章节采用可取消的有限纵深转场。
- 手机初入图谱居中李承三，关系装饰不播放，仅纸面短暂透明度变化。减少动态模式完全静态。
- 继续只放大所选节点与李承三，其他节点虚化，24节点、分类、史料和原图未改。
- 保留真实React Bits/GSAP动画，仅将入口触发改为IntersectionObserver及被动事件，移除ScrollTrigger全局空转；无全局强制ticker休眠。

## 验证

CI：https://github.com/Ppzh-Wick/normal/actions/runs/41809145471
133项Node测试、36项原有Chromium回归和23项新增动作/取消/静止期测试通过。新测试要求前台连续900ms没有新增RAF请求、RAF回调、待执行RAF或活动动画，原生滚动结束后再测，不把短暂pending=0误当静止。

已审查桌面关系动作、静止纸面、章节转场、手机图谱与弹窗截图。JS从实验2的552979字节减至513720字节。CSS为187516字节。

这些是无GPU要求的CI Chromium结果，不是实体手机、Safari或硬件帧率保证。新增关系与章节动作是原创实现，并非Active Theory代码；组件原始许可与改动说明保留于licenses和docs。
