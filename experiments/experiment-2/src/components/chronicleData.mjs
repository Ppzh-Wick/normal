// Preserve every existing sourced chronology event, not just geographical stops.
// The two posthumous events are explicitly separated from the life timeline.
const images={1899:['li-chengsan','李承三历史肖像，拍摄年份与原始出处待补充；非出生现场。'],1928:['henan','河南大学校门旧影，拍摄年份未注明。'],1931:['berlin','柏林大学1938年旧影，晚于留学时段；非留学现场照片。'],1936:['berlin','柏林大学1938年旧影，晚于学成归国；只作求学背景材料。'],1940:['jialing','嘉陵江地形图集第24号图，剑门关邓家坡，1940年底。'],1946:['jialing','图为1940年底所绘；本条1946年指报告出版，而非图像绘制。'],1949:['chongqing','重庆大学1933年校门旧影，非1949年任教现场。'],1950:['chongqing','重庆大学1933年校门旧影，非专业创办现场。'],1954:['chongqing','重庆大学1933年校门旧影，非模型教学现场。'],1956:['chengdu','学院旧校门，照片年份未注明；不认定合影人物身份。'],1959:['chengdu','学院旧校门，非编图或教材指导现场。'],1961:['chengdu','学院旧校门，非教材出版现场。'],1967:['li-chengsan','李承三历史肖像，拍摄年份与原始出处待补充。']};
export function chronicleRecords(data){return data.graph.milestones.map((m,i)=>({
 ...m,id:'chronicle-'+m.year,year:+m.year,date:m.year==='1899'?'1899年5月':m.year==='1967'?'1967年5月21日':m.year+'年',
 phase:+m.year>1967?'身后纪念':+m.year<=1928?'早年与求学':+m.year<=1936?'研习与归国':+m.year<=1946?'调查与著述':+m.year<=1956?'任教与专业建设':'研究与学术传承',
 detail:m.year==='1926'?'年谱记述在南开矿科学习后，因经费问题中断学业，返涉县任小学教师。年谱对停办范围表述不清，此处不作裁定。':m.year==='1965'?'虽行动不便，仍在成都家中听取考察队汇报，指导西昌螺髻山冰川遗迹考察报告编写；不是本人前往西昌。':m.detail,
 media:images[m.year]?.[0],imageNote:images[m.year]?.[1],posthumous:+m.year>1967,index:i
}))}
