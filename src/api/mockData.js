// Mock 数据 - 用于 API Host 未配置时的回退
// 提供多个城市的真实形态数据，自动按时间轮换
const CITIES = {
  '101010100': { name: '北京', adm1: '北京', adm2: '北京', country: '中国' },
  '101020100': { name: '上海', adm1: '上海', adm2: '上海', country: '中国' },
  '101280101': { name: '广州', adm1: '广东', adm2: '广州', country: '中国' },
  '101110101': { name: '西安', adm1: '陕西', adm2: '西安', country: '中国' },
  '101280601': { name: '深圳', adm1: '广东', adm2: '深圳', country: '中国' },
  '101190101': { name: '南京', adm1: '江苏', adm2: '南京', country: '中国' },
  '101210101': { name: '杭州', adm1: '浙江', adm2: '杭州', country: '中国' },
  '101270101': { name: '成都', adm1: '四川', adm2: '成都', country: '中国' },
  '101030100': { name: '天津', adm1: '天津', adm2: '天津', country: '中国' },
  '101040100': { name: '重庆', adm1: '重庆', adm2: '重庆', country: '中国' },
  '101050101': { name: '哈尔滨', adm1: '黑龙江', adm2: '哈尔滨', country: '中国' },
  '101060101': { name: '长春', adm1: '吉林', adm2: '长春', country: '中国' },
  '101070101': { name: '沈阳', adm1: '辽宁', adm2: '沈阳', country: '中国' },
  '101080101': { name: '呼和浩特', adm1: '内蒙古', adm2: '呼和浩特', country: '中国' },
  '101090101': { name: '石家庄', adm1: '河北', adm2: '石家庄', country: '中国' },
  '101100101': { name: '太原', adm1: '山西', adm2: '太原', country: '中国' },
  '101120101': { name: '济南', adm1: '山东', adm2: '济南', country: '中国' },
  '101130101': { name: '乌鲁木齐', adm1: '新疆', adm2: '乌鲁木齐', country: '中国' },
  '101140101': { name: '西宁', adm1: '青海', adm2: '西宁', country: '中国' },
  '101150101': { name: '兰州', adm1: '甘肃', adm2: '兰州', country: '中国' },
  '101160101': { name: '银川', adm1: '宁夏', adm2: '银川', country: '中国' },
  '101170101': { name: '郑州', adm1: '河南', adm2: '郑州', country: '中国' },
  '101180101': { name: '武汉', adm1: '湖北', adm2: '武汉', country: '中国' },
  '101200101': { name: '合肥', adm1: '安徽', adm2: '合肥', country: '中国' },
  '101220101': { name: '福州', adm1: '福建', adm2: '福州', country: '中国' },
  '101230101': { name: '南昌', adm1: '江西', adm2: '南昌', country: '中国' },
  '101240101': { name: '长沙', adm1: '湖南', adm2: '长沙', country: '中国' },
  '101250101': { name: '贵阳', adm1: '贵州', adm2: '贵阳', country: '中国' },
  '101260101': { name: '昆明', adm1: '云南', adm2: '昆明', country: '中国' },
  '101290101': { name: '南宁', adm1: '广西', adm2: '南宁', country: '中国' },
  '101300101': { name: '海口', adm1: '海南', adm2: '海口', country: '中国' },
  '101310101': { name: '拉萨', adm1: '西藏', adm2: '拉萨', country: '中国' },
  '101320101': { name: '香港', adm1: '香港', adm2: '香港', country: '中国' },
  '101330101': { name: '澳门', adm1: '澳门', adm2: '澳门', country: '中国' },
  '101340101': { name: '台北', adm1: '台湾', adm2: '台北', country: '中国' }
}

const ICON_POOL = {
  sunny:  { icon: '100', text: '晴' },
  partly: { icon: '101', text: '多云' },
  cloudy: { icon: '104', text: '阴' },
  rainy:  { icon: '305', text: '小雨' },
  snowy:  { icon: '401', text: '小雪' },
  foggy:  { icon: '501', text: '雾' }
}

// 根据城市 ID 稳定地选择天气态（每次刷新看起来一样）
function pickByCity(id, options) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return options[Math.abs(h) % options.length]
}

// 根据时间让天气态在 6 种类别间循环展示，方便预览所有视觉态
function pickByCityAndTime(id, options) {
  const t = Math.floor(Date.now() / 60000) // 每分钟切换
  return options[(parseInt(id.slice(-3), 10) + t) % options.length]
}

export function mockCityLookup(keyword) {
  const k = keyword.toLowerCase()
  return {
    code: '200',
    location: Object.entries(CITIES)
      .filter(([id, c]) => c.name.includes(keyword) || c.adm1.includes(keyword) || c.adm2.includes(keyword) || c.country.toLowerCase().includes(k))
      .slice(0, 8)
      .map(([id, c]) => ({ id, ...c }))
  }
}

export function mockNow(locationId) {
  const state = pickByCityAndTime(locationId, ['sunny', 'partly', 'cloudy', 'rainy', 'snowy', 'foggy'])
  const base = { sunny: 22, partly: 19, cloudy: 16, rainy: 14, snowy: -2, foggy: 12 }[state]
  const c = ICON_POOL[state]
  return {
    code: '200',
    now: {
      temp: (base + (Math.random() - 0.5) * 4).toFixed(1),
      feelsLike: (base + (Math.random() - 0.5) * 3).toFixed(1),
      humidity: (40 + Math.random() * 40).toFixed(0),
      windDir: ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'][Math.floor(Math.random() * 8)],
      windScale: (state === 'rainy' ? '3' : (state === 'snowy' ? '4' : '2')),
      windSpeed: (state === 'rainy' ? '15' : (state === 'snowy' ? '20' : '8')),
      pressure: (1005 + Math.floor(Math.random() * 20)).toString(),
      vis: state === 'foggy' ? '2' : '15',
      text: c.text,
      icon: c.icon,
      obsTime: new Date().toISOString().replace('T', ' ').substring(0, 19) + '+08:00'
    }
  }
}

export function mockHourly(locationId) {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  const state = pickByCityAndTime(locationId, ['sunny', 'partly', 'cloudy', 'rainy', 'snowy', 'foggy'])
  const base = { sunny: 22, partly: 19, cloudy: 16, rainy: 14, snowy: -2, foggy: 12 }[state]
  const list = []
  for (let i = 0; i < 24; i++) {
    const t = new Date(now.getTime() + i * 3600 * 1000)
    // 模拟日变化
    const hour = t.getHours()
    const dayCurve = -Math.cos((hour - 14) / 24 * Math.PI * 2) * 4
    const temp = base + dayCurve + (Math.random() - 0.5) * 2
    const local = Math.random()
    let s = state
    if (i < 6 && local < 0.3) s = 'cloudy'
    if (i > 18 && local < 0.4) s = 'cloudy'
    const c = ICON_POOL[s]
    list.push({
      fxTime: t.toISOString().replace('T', ' ').substring(0, 19) + '+08:00',
      temp: temp.toFixed(1),
      text: c.text,
      icon: c.icon,
      windDir: '南风',
      windScale: '2'
    })
  }
  return { code: '200', hourly: list }
}

export function mockDaily(locationId) {
  const today = new Date()
  const state = pickByCityAndTime(locationId, ['sunny', 'partly', 'cloudy', 'rainy', 'snowy', 'foggy'])
  const base = { sunny: 22, partly: 19, cloudy: 16, rainy: 14, snowy: -2, foggy: 12 }[state]
  const list = []
  for (let i = 0; i < 7; i++) {
    const t = new Date(today)
    t.setDate(t.getDate() + i)
    const swing = 6 + Math.random() * 4
    const max = base + swing / 2
    const min = base - swing / 2
    const s = pickByCityAndTime(locationId + i, ['sunny', 'partly', 'cloudy', 'rainy', 'snowy', 'foggy'])
    const c = ICON_POOL[s]
    const c2 = ICON_POOL[Math.random() < 0.5 ? 'cloudy' : 'partly']
    list.push({
      fxDate: t.toISOString().substring(0, 10),
      tempMax: max.toFixed(1),
      tempMin: min.toFixed(1),
      textDay: c.text,
      textNight: c2.text,
      iconDay: c.icon,
      iconNight: c2.icon
    })
  }
  return { code: '200', daily: list }
}
