# v29 项目区背景比较

2026-10-21，在本地检查点 cd50338 后继续。只迭代项目、优势及页脚的背景与对应阅读表面，保留已确认的酒红 Silk 首屏、香槟金 Lightfall 人物墙和独立人物页。

## 三套已调色方案

| 查询参数 | 名称 | 组件与色值 | 取舍 |
| --- | --- | --- | --- |
| ambient=threads（默认） | 铜金脉络 | Threads：#bd8b6b → #e7d3af；暖黑底 #171114 | 推荐。横向线束呼应地层与学脉，与人物墙纵向光瀑形成区别 |
| ambient=aurora | 酒红曙光 | Aurora：#572530 / #b98d63 / #77343d | 色场更明显，庆典感较强；适合想增加红色氛围时 |
| ambient=darkveil | 烟铜幕光 | Dark Veil：#a77d64 | 暗部更柔和，适合希望背景安静、正文更突出的版本 |

完整参数集中在 src/data/researchBackgrounds.js。无效参数回落至 Threads。默认入口 http://127.0.0.1:4185/?v=29#home ，先展示首屏；对比时可将 ambient 参数分别改为上述三项。

## 方向与范围

沿用现有展陈设计，不重新抽签、不改品牌或字体体系。主体专属线索包括：成都理工、建校1956年、八大学者、五大学科奠基人、攀枝花矿产调查、四川大地构造图、化石地史、已有黑白档案肖像、酒红校庆首屏、独立人物专题。

概念句：把这十三位人物留下的地学研究与学科传承，转化为持续流动的线束。保留的实际交互是从研究项目进入对应人物专题，继续阅读其贡献与经历。

项目区论证：三项具体研究说明他们留下了什么；优势区论证：野外、建系、著述、育人说明成果背后的工作方法。已有内容和三张示意图保留，不伪装成真实史料。

新样张将原亮青背景及浅色卡片改为暖黑表面、暖白正文、铜金点缀；阅读正文16px，去除重复编号、英文小标签和装饰线。用户先前指定的 BorderGlow 悬停效果保留并调为暖色，玻璃导航和首屏不在本轮重排范围内。用户明确要求 React Bits 动态背景，优先于 taste skill 对渐变/光效的通用限制。

## 性能与降级

- 三款均原生 WebGL2，不新增 OGL/Three 或其他依赖。
- 按方案懒加载，只加载选中背景；首屏和人物区不启动下方背景。
- 30fps 调度、最终画布最多100万像素、离屏/隐藏停止。减少动态效果显示静帧。
- WebGL缺失时保留暖黑底；上下文丢失后停止绘制并隐藏失效画布，不承诺自动重建。
- 修复 DarkVeil resize 时 immutable texture 的重建问题，补足 Aurora 编译失败的资源清理。
- 背景不监听鼠标，不拦截正文、按钮和人物链接。

## 来源与许可

- [Threads](https://reactbits.dev/backgrounds/threads)、[Aurora](https://reactbits.dev/backgrounds/aurora)、[Dark Veil](https://reactbits.dev/backgrounds/dark-veil)，作者 David Haz。
- 官方源码与哈希记录：RESEARCH_BACKGROUNDS_SOURCE.json；原件在项目 inputs/react-bits-backgrounds-v29/，DarkVeil原件沿用inputs/react-bits-backgrounds-v23/。
- MIT + Commons Clause，完整许可位于 public/licenses/React-Bits-Backgrounds-LICENSE.md，构建附带；页脚链接当前方案官方页面。
- 无新增照片、视频或生成图片；原有三张项目SVG是本项目的信息示意图，人物历史肖像沿用已归档出处。

本轮为本地比较样张，未推送GitHub；仓库根发布文件保持cd50338的v28检查点。最终构建与截图、尺寸和功能验证结果见项目 docs/项目区背景比较-v29.md。
