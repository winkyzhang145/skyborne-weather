// SKYBORNE · 3D 天气主入口
import * as THREE from 'three'
import { WeatherScene } from './three/scene.js?v=7'
import { qweather } from './api/qweather.js?v=7'
import { getState, setState, subscribe } from './state/store.js?v=7'
import { getWeatherState } from './utils/weatherState.js?v=7'
import { musicbox } from './audio/musicbox.js?v=1'
import {
  renderMainCard, renderHourly, renderDaily,
  updateClock, updateTime, setLoading, showToast
} from './components/ui.js?v=7'

// ============== 3D 场景 ==============
const canvas = document.getElementById('scene')
let scene3d = null
try {
  const testCanvas = document.createElement('canvas')
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
  if (!gl) throw new Error('WebGL 不可用')
  scene3d = new WeatherScene(canvas)
  window.__weather3D = scene3d
} catch (err) {
  console.error('3D 场景初始化失败', err)
  canvas.style.display = 'none'
  document.body.classList.add('no-webgl')
  showToast('3D 不可用，已切换至纯数据视图', 'error')
}

// ============== 城市加载 ==============
const LS_CITY = 'skyborne.lastCity'

const DEFAULT_CITY = { id: '101010100', name: '北京', adm1: '北京', adm2: '北京', country: '中国' }

async function loadCity(city) {
  setState({ loading: true, error: null, city })
  try {
    const [nowRes, hourRes, dayRes] = await Promise.all([
      qweather.now(city.id),
      qweather.hourly(city.id),
      qweather.daily(city.id)
    ])
    const wState = getWeatherState(nowRes.now.icon)
    setState({
      current: nowRes.now,
      hourly: hourRes.hourly || [],
      daily: dayRes.daily || [],
      weatherState: wState,
      loading: false
    })
    if (scene3d) {
      scene3d.setWeatherState(wState)
      scene3d.setCityName(city.name)
      const tod = timeToFraction(nowRes.now.obsTime)
      scene3d.setTimeOfDay(tod)
    }
    localStorage.setItem(LS_CITY, JSON.stringify(city))
    updateDataSource()
    updateActiveChip(city.id)
  } catch (err) {
    console.error(err)
    setState({ loading: false, error: err.message })
    showToast('数据获取失败：' + err.message, 'error')
  }
}

function timeToFraction(obsTime) {
  if (!obsTime) return 0.5
  const d = new Date(obsTime)
  if (isNaN(d.getTime())) return 0.5
  return (d.getHours() + d.getMinutes() / 60) / 24
}

function updateDataSource() {
  const el = document.getElementById('dataSource')
  if (!el) return
  if (qweather.isMock?.()) {
    el.textContent = '演示数据'
    el.parentElement.title = '当前使用本地 mock 数据（QWeather API Host 未配置）'
  } else {
    el.textContent = '实时数据'
    el.parentElement.title = ''
  }
}

// ============== UI 渲染订阅 ==============
let lastWeatherState = null
subscribe((state) => {
  if (state.current) {
    renderMainCard(state)
    updateTime(state)
  }
  if (state.hourly.length) renderHourly(state)
  if (state.daily.length)  renderDaily(state)
  if (!state.loading)      setLoading(false)
  // 天气态变化 → 切 BGM pattern
  if (state.weatherState && state.weatherState !== lastWeatherState) {
    lastWeatherState = state.weatherState
    musicbox.setWeather(state.weatherState)
  }
})

// ============== BGM 按钮 ==============
const bgmBtn = document.getElementById('bgmBtn')
if (bgmBtn) {
  bgmBtn.addEventListener('click', async () => {
    try {
      if (musicbox.isPlaying) {
        musicbox.pause()
        bgmBtn.setAttribute('aria-pressed', 'false')
        bgmBtn.classList.remove('is-playing')
      } else {
        await musicbox.play()
        bgmBtn.setAttribute('aria-pressed', 'true')
        bgmBtn.classList.add('is-playing')
      }
    } catch (err) {
      console.error('BGM 播放失败', err)
      showToast('背景音乐加载失败：' + err.message, 'error')
    }
  })
}

// ============== 时钟 ==============
updateClock()
setInterval(updateClock, 1000)

// ============== 搜索弹窗（含焦点陷阱）==============
const modal = document.getElementById('searchModal')
const input = document.getElementById('searchInput')
const results = document.getElementById('searchResults')
const searchBtn = document.getElementById('searchBtn')
let lastFocused = null

// 焦点陷阱：在模态内 Tab/Shift+Tab 循环
function trapFocus(e) {
  if (e.key !== 'Tab') return
  const focusables = modal.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  if (!focusables.length) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

function openSearch() {
  lastFocused = document.activeElement
  modal.hidden = false
  input.value = ''
  results.innerHTML = '<div class="modal__hint" role="status">输入至少 2 个字符开始搜索</div>'
  setTimeout(() => input.focus(), 50)
  document.addEventListener('keydown', trapFocus, true)
}
function closeSearch() {
  modal.hidden = true
  document.removeEventListener('keydown', trapFocus, true)
  if (lastFocused && typeof lastFocused.focus === 'function') {
    lastFocused.focus()
  }
}

searchBtn.addEventListener('click', openSearch)
modal.addEventListener('click', (e) => {
  if (e.target.dataset.close !== undefined) closeSearch()
})
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    if (modal.hidden) openSearch()
  } else if (e.key === 'Escape' && !modal.hidden) {
    closeSearch()
  }
})

let searchTimer = null
input.addEventListener('input', () => {
  const q = input.value.trim()
  if (searchTimer) clearTimeout(searchTimer)
  if (q.length < 2) {
    results.innerHTML = '<div class="modal__hint" role="status">输入至少 2 个字符开始搜索</div>'
    return
  }
  results.innerHTML = '<div class="modal__hint" role="status">搜索中…</div>'
  searchTimer = setTimeout(async () => {
    try {
      const res = await qweather.lookup(q)
      if (!res.location || !res.location.length) {
        results.innerHTML = '<div class="modal__hint" role="status">未找到匹配的城市</div>'
        return
      }
      results.innerHTML = res.location.map(city => `
        <div class="result" role="option" tabindex="0" data-id="${city.id}">
          <div>
            <div class="result__name">${city.name}${city.adm2 && city.adm2 !== city.name ? ' · ' + city.adm2 : ''}</div>
            <div class="result__region">${[city.adm1, city.country].filter(Boolean).join(' · ')}</div>
          </div>
          <div class="result__id">${city.id}</div>
        </div>
      `).join('')
      results.querySelectorAll('.result').forEach(el => {
        const activate = () => {
          const city = {
            id: el.dataset.id,
            name: el.querySelector('.result__name').textContent.split(' · ')[0],
            adm1: '',
            adm2: '',
            country: ''
          }
          closeSearch()
          loadCity(city)
        }
        el.addEventListener('click', activate)
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            activate()
          }
        })
      })
    } catch (err) {
      results.innerHTML = '<div class="modal__hint" role="status">搜索失败：' + err.message + '</div>'
    }
  }, 300)
})

// ============== 热门城市快捷标签 ==============
const cityNameMap = {
  '101010100': '北京', '101020100': '上海', '101030100': '天津', '101040100': '重庆',
  '101050101': '哈尔滨', '101060101': '长春', '101070101': '沈阳', '101080101': '呼和浩特',
  '101090101': '石家庄', '101100101': '太原', '101110101': '西安', '101120101': '济南',
  '101130101': '乌鲁木齐', '101140101': '西宁', '101150101': '兰州', '101160101': '银川',
  '101170101': '郑州', '101180101': '武汉', '101190101': '南京', '101200101': '合肥',
  '101210101': '杭州', '101220101': '福州', '101230101': '南昌', '101240101': '长沙',
  '101250101': '贵阳', '101260101': '昆明', '101270101': '成都', '101280101': '广州',
  '101280601': '深圳', '101290101': '南宁', '101300101': '海口', '101310101': '拉萨',
  '101320101': '香港', '101330101': '澳门', '101340101': '台北'
}
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const id = chip.dataset.city
    if (!id) return
    const name = cityNameMap[id] || chip.textContent
    loadCity({ id, name, adm1: '', adm2: '', country: '中国' })
  })
})
function updateActiveChip(cityId) {
  document.querySelectorAll('.chip').forEach(c => {
    const active = c.dataset.city === cityId
    c.classList.toggle('is-active', active)
    c.setAttribute('aria-pressed', active ? 'true' : 'false')
  })
}

// ============== 启动 ==============
async function bootstrap() {
  let city = DEFAULT_CITY
  try {
    const saved = localStorage.getItem(LS_CITY)
    if (saved) city = JSON.parse(saved)
  } catch {}
  updateActiveChip(city.id)
  await loadCity(city)
}

// 兜底：若 5s 内未加载完成也强制隐藏 splash
setTimeout(() => {
  const s = document.getElementById('splash')
  if (s && !s.classList.contains('is-gone')) s.classList.add('is-gone')
}, 5000)

bootstrap()
