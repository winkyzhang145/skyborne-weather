// 极简响应式状态
const subscribers = new Set()
let state = {
  city: null,           // { id, name, adm1, adm2, country }
  current: null,        // 实况
  hourly: [],           // 24h
  daily: [],            // 7d
  weatherState: 'sunny',
  loading: true,
  error: null
}

export function getState() { return state }

export function setState(patch) {
  state = { ...state, ...patch }
  subscribers.forEach(fn => fn(state))
}

export function subscribe(fn) {
  subscribers.add(fn)
  fn(state)
  return () => subscribers.delete(fn)
}
