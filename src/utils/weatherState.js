// 由和风天气 icon 字段映射到视觉态
// icon 编码规则：https://dev.qweather.com/docs/resource/icons/
// 100-103 晴；104-213 多云；300-305 雨；400-499 雪；500-515 雾霾；900+ 极端
export function getWeatherState(icon) {
  const code = parseInt(icon, 10)
  if (Number.isNaN(code)) return 'sunny'
  if (code === 100 || code === 150) return 'sunny'
  if (code >= 101 && code <= 103) return 'sunny'        // 少云/多云间歇晴
  if ((code >= 104 && code <= 213) || (code >= 151 && code <= 213)) return 'cloudy'
  if ((code >= 300 && code <= 399) || (code >= 350 && code <= 399)) return 'rainy'
  if (code >= 400 && code <= 499) return 'snowy'
  if (code >= 500 && code <= 515) return 'foggy'
  if (code >= 900 && code <= 999) return 'foggy'         // 极端情况归为雾
  return 'sunny'
}

// 天气描述 -> 图标 SVG path
export const WEATHER_ICON_SVG = {
  sunny: 'M32 12a20 20 0 1 0 0 40 20 20 0 0 0 0-40Zm0-10a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Zm0 50a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0v-6a3 3 0 0 1 3-3ZM5 32a3 3 0 0 1 3-3h6a3 3 0 0 1 0 6H8a3 3 0 0 1-3-3Zm45 0a3 3 0 0 1 3-3h6a3 3 0 0 1 0 6h-6a3 3 0 0 1-3-3Z',
  cloudy: 'M22 22a14 14 0 0 1 27 4 11 11 0 0 1-3 22H18a12 12 0 0 1 4-26Z',
  partly: 'M22 14a12 12 0 0 1 23 3 9 9 0 0 1 0 18H18a10 10 0 0 1 4-21Z',
  rainy: 'M22 14a12 12 0 0 1 23 3 9 9 0 0 1 0 18H18a10 10 0 0 1 4-21ZM18 40l-2 8M28 40l-2 8M38 40l-2 8M48 40l-2 8',
  snowy: 'M22 14a12 12 0 0 1 23 3 9 9 0 0 1 0 18H18a10 10 0 0 1 4-21ZM22 40v6M18 43h8M40 38v6M36 41h8',
  foggy: 'M8 22h32M8 30h40M8 38h28M12 46h36'
}

// 简化的天气 icon -> 类型
export function getIconType(icon) {
  const state = getWeatherState(icon)
  // 区分"多云"和"少云"
  const code = parseInt(icon, 10)
  if (code === 101 || code === 102 || code === 103) return 'partly'
  return state
}
