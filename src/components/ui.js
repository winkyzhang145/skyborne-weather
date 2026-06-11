// UI 组件 - 渲染/更新 DOM
import { getWeatherIconSVG } from './icons.js?v=7'
import { getIconType, getWeatherState } from '../utils/weatherState.js?v=7'

const $ = (sel) => document.querySelector(sel)

// 本地化格式化
const hourFmt = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', hour12: false })
const hmFmt = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })

export function renderMainCard(state) {
  if (!state.current) return
  const c = state.current
  const place = state.city
  $('#placeName').textContent = place?.name || '— —'
  const region = [place?.adm2, place?.adm1, place?.country].filter(Boolean).join(' · ')
  $('#placeRegion').textContent = region || '— —'

  $('#tempValue').textContent = Math.round(parseFloat(c.temp))
  $('#feelsLike').textContent = Math.round(parseFloat(c.feelsLike))
  $('#descText').textContent = c.text || '— —'

  const highs = state.daily.map(d => parseFloat(d.tempMax))
  const lows  = state.daily.map(d => parseFloat(d.tempMin))
  $('#highTemp').textContent = isFinite(Math.max(...highs)) ? Math.round(Math.max(...highs)) : '--'
  $('#lowTemp').textContent  = isFinite(Math.min(...lows))  ? Math.round(Math.min(...lows))  : '--'

  // 图标
  const icon = $('#weatherIcon')
  const type = getIconType(c.icon)
  icon.innerHTML = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${getWeatherIconSVG(type)}</svg>`

  // 指标
  $('#humidity').textContent  = c.humidity ?? '--'
  $('#windDir').textContent   = c.windDir || '—'
  $('#windLevel').textContent = `${c.windScale || '--'}级`
  $('#pressure').textContent  = c.pressure ?? '--'
  $('#vis').textContent       = c.vis ?? '--'

  // 天气态 -> body
  const wState = getWeatherState(c.icon)
  document.body.dataset.state = wState
}

export function renderHourly(state) {
  const list = $('#hourlyList')
  if (!state.hourly || !state.hourly.length) {
    list.innerHTML = '<div class="hourly__empty" role="status">暂无数据</div>'
    return
  }
  const html = state.hourly.slice(0, 24).map((h, i) => {
    const t = new Date(h.fxTime)
    // 仅第一个时段标记为"现在"
    const isNow = i === 0
    const timeLabel = isNow ? '现在' : hourFmt.format(t)
    const type = getIconType(h.icon)
    const temps = state.hourly.map(x => parseFloat(x.temp))
    const tMin = Math.min(...temps)
    const tMax = Math.max(...temps)
    const tNow = parseFloat(h.temp)
    const ratio = tMax > tMin ? (tNow - tMin) / (tMax - tMin) : 0.5
    return `
      <button type="button" class="hour ${isNow ? 'is-now' : ''}" data-index="${i}" data-time="${h.fxTime}" aria-pressed="false" aria-label="${timeLabel} ${Math.round(tNow)} 度">
        <span class="hour__time">${timeLabel}</span>
        <span class="hour__icon" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${getWeatherIconSVG(type)}</svg></span>
        <span class="hour__temp">${Math.round(tNow)}°</span>
        <span class="hour__bar" style="width:${20 + ratio * 80}%" aria-hidden="true"></span>
      </button>
    `
  }).join('')
  list.innerHTML = html

  // 点击小时卡交互
  list.querySelectorAll('.hour').forEach(el => {
    const onActivate = () => {
      list.querySelectorAll('.hour').forEach(e => e.setAttribute('aria-pressed', 'false'))
      el.setAttribute('aria-pressed', 'true')
      // 通知 3D 场景对应该时刻
      if (window.__weather3D?.focusHour) {
        const idx = parseInt(el.dataset.index, 10)
        window.__weather3D.focusHour(idx)
      }
    }
    el.addEventListener('click', onActivate)
  })
}

export function renderDaily(state) {
  const list = $('#dailyList')
  if (!state.daily || !state.daily.length) {
    list.innerHTML = '<div class="daily__empty" role="status">暂无数据</div>'
    return
  }
  const days = ['日', '一', '二', '三', '四', '五', '六']
  const html = state.daily.slice(0, 7).map((d, i) => {
    const date = new Date(d.fxDate)
    const day = i === 0 ? '今日' : `周${days[date.getDay()]}`
    const md = `${date.getMonth() + 1}/${date.getDate()}`
    const type = getIconType(d.iconDay)
    return `
      <div class="day" role="listitem">
        <div class="day__date"><b>${day}</b><br/>${md}</div>
        <div class="day__text">${d.textDay || '—'}</div>
        <div class="day__icon" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${getWeatherIconSVG(type)}</svg></div>
        <div class="day__temps"><span class="lo">${Math.round(parseFloat(d.tempMin))}°</span><span class="hi">${Math.round(parseFloat(d.tempMax))}°</span></div>
      </div>
    `
  }).join('')
  list.innerHTML = html
}

export function updateClock() {
  const d = new Date()
  const txt = hmFmt.format(d)
  const el = $('#clock')
  el.textContent = txt
  el.dateTime = d.toISOString()
}

export function updateTime(state) {
  if (state.current?.obsTime) {
    const d = new Date(state.current.obsTime)
    if (!isNaN(d.getTime())) {
      const txt = hmFmt.format(d)
      $('#updateTime').textContent = `同步于 ${txt}`
    }
  }
}

export function setLoading(loading) {
  const splash = $('#splash')
  if (!loading) splash.classList.add('is-gone')
}

export function showToast(message, type = 'info') {
  const toast = $('#toast')
  toast.textContent = message
  toast.classList.toggle('is-error', type === 'error')
  toast.hidden = false
  clearTimeout(toast._t)
  toast._t = setTimeout(() => { toast.hidden = true }, 3500)
}
