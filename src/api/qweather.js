// 和风天气 API 封装（带回退到 mock 数据）
// 真实 API：/api/qweather/*  ->  server.js -> 自定义 Host
// 真实 API：/api/geo/*       ->  server.js -> 自定义 Host (geo/v2/...)
// 回退：若上游错误，使用本地 mock 数据保证 UI 可用
import { mockNow, mockHourly, mockDaily, mockCityLookup } from './mockData.js?v=5'

const BASE = '/api'

// 跟踪最近一次请求模式：'real' | 'mock'
let lastMode = 'real'

async function tryReal(path, params) {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') search.set(k, v)
  }
  const url = `${BASE}${path}?${search.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  // QWeather 业务错误
  if (json.error || (json.code && json.code !== '200' && json.code !== 200)) {
    throw new Error(json.error?.title || json.message || `QWeather ${json.code}`)
  }
  // 业务层 200 但无数据
  if (path.endsWith('/lookup') && (!json.location || !json.location.length)) {
    throw new Error('未找到城市')
  }
  lastMode = 'real'
  return json
}

function useMock(err) {
  console.warn('[API] fallback to mock:', err.message)
  lastMode = 'mock'
}

export const qweather = {
  isMock: () => lastMode === 'mock',
  async lookup(location) {
    try {
      return await tryReal('/geo/city/lookup', { location, number: 8, lang: 'zh' })
    } catch (err) {
      useMock(err)
      return mockCityLookup(location)
    }
  },
  async now(locationId) {
    try {
      return await tryReal('/qweather/weather/now', { location: locationId, lang: 'zh', unit: 'm' })
    } catch (err) {
      useMock(err)
      return mockNow(locationId)
    }
  },
  async hourly(locationId) {
    try {
      return await tryReal('/qweather/weather/24h', { location: locationId, lang: 'zh', unit: 'm' })
    } catch (err) {
      useMock(err)
      return mockHourly(locationId)
    }
  },
  async daily(locationId) {
    try {
      return await tryReal('/qweather/weather/7d', { location: locationId, lang: 'zh', unit: 'm' })
    } catch (err) {
      useMock(err)
      return mockDaily(locationId)
    }
  }
}
