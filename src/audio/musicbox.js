// 纯 Web Audio API 合成八音盒
// 零外部依赖，无需加载采样，浏览器原生秒开
// 音色：三角波基频 + 正弦倍频 + 短包络 + 卷积混响 + 低通滤波

const NOTE_FREQ = {}
;['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].forEach((n, i) => {
  for (let o = 0; o <= 8; o++) {
    const midi = (o + 1) * 12 + i
    NOTE_FREQ[n + o] = 440 * Math.pow(2, (midi - 69) / 12)
  }
})

const DUR_TO_BEATS = { '16n': 0.25, '8n': 0.5, '4n': 1, '2n': 2, '1n': 4 }

// 6 套天气 → 6 套 pattern（与原设计一致）
const PATTERNS = {
  sunny: {
    bpm: 96,
    pattern: [
      [0, 'C5', '8n', 0.7], [1, 'E5', '8n', 0.6], [2, 'G5', '8n', 0.7], [3, 'C6', '4n', 0.8],
      [4, 'E5', '8n', 0.55], [5, 'G5', '8n', 0.6], [6, 'B5', '8n', 0.65], [7, 'A5', '4n', 0.7]
    ]
  },
  partly: {
    bpm: 80,
    pattern: [
      [0, 'F4', '4n', 0.55], [2, 'A4', '4n', 0.5], [4, 'C5', '4n', 0.6], [6, 'F5', '2n', 0.65]
    ]
  },
  cloudy: {
    bpm: 70,
    pattern: [
      [0, 'A3', '2n', 0.5], [2, 'C4', '4n', 0.45], [4, 'E4', '4n', 0.5], [6, 'A4', '1n', 0.6]
    ]
  },
  rainy: {
    bpm: 72,
    pattern: [
      [0,   'A4', '8n', 0.6], [0.5, 'G4', '16n', 0.4], [1, 'E4', '8n', 0.55],
      [2,   'C4', '8n', 0.5], [2.5, 'D4', '16n', 0.4], [3, 'E4', '4n', 0.6],
      [4,   'C4', '8n', 0.45], [5, 'A3', '4n', 0.55], [6, 'E4', '4n', 0.5], [7, 'A3', '2n', 0.6]
    ]
  },
  snowy: {
    bpm: 60,
    pattern: [
      [0, 'C6', '2n', 0.5], [2, 'E6', '2n', 0.55], [4, 'G6', '2n', 0.6], [6, 'C7', '1n', 0.65]
    ]
  },
  foggy: {
    bpm: 50,
    pattern: [
      [0, 'C4', '1n', 0.45], [4, 'G4', '1n', 0.5]
    ]
  }
}

function makeImpulse(ctx, duration, decay) {
  const rate = ctx.sampleRate
  const length = Math.floor(rate * duration)
  const impulse = ctx.createBuffer(2, length, rate)
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
    }
  }
  return impulse
}

export const musicbox = {
  ctx: null,
  filter: null,
  reverb: null,
  master: null,
  _timer: null,
  _nextStepTime: 0,
  _stepIdx: 0,
  _bpm: 96,
  _pattern: null,
  _stepsPerLoop: 8,
  isReady: false,
  isPlaying: false,
  currentWeather: null,
  _pendingWeather: null,

  _ensureCtx() {
    if (this.ctx) return
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) throw new Error('浏览器不支持 Web Audio API')
    this.ctx = new Ctx()

    this.filter = this.ctx.createBiquadFilter()
    this.filter.type = 'lowpass'
    this.filter.frequency.value = 8000

    this.reverb = this.ctx.createConvolver()
    this.reverb.buffer = makeImpulse(this.ctx, 2.5, 2)
    this.reverbWet = this.ctx.createGain()
    this.reverbWet.gain.value = 0.35
    this.reverbDry = this.ctx.createGain()
    this.reverbDry.gain.value = 0.65

    this.master = this.ctx.createGain()
    this.master.gain.value = 0.4

    // 链：source → filter → [dry + reverb] → master → destination
    this.filter.connect(this.reverbDry).connect(this.master)
    this.filter.connect(this.reverb)
    this.reverb.connect(this.reverbWet).connect(this.master)
    this.master.connect(this.ctx.destination)
  },

  async init() {
    this._ensureCtx()
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
    this.isReady = true
    if (this._pendingWeather) {
      this._setPattern(this._pendingWeather)
      this._pendingWeather = null
    }
  },

  setWeather(weather) {
    if (!weather) return
    if (!this.isReady || !this.ctx) {
      this._pendingWeather = weather
      return
    }
    this._setPattern(weather)
  },

  _setPattern(weather) {
    if (this.currentWeather === weather && this._pattern) return
    const cfg = PATTERNS[weather] || PATTERNS.sunny
    this._bpm = cfg.bpm
    this._pattern = cfg.pattern
    this._stepsPerLoop = 8
    this._stepIdx = 0
    this.currentWeather = weather
  },

  _playNote(note, time, beats, vel) {
    const freq = NOTE_FREQ[note] || 440
    const dur = (60 / this._bpm) * beats

    const osc = this.ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq

    const osc2 = this.ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = freq * 2

    const gain = this.ctx.createGain()
    const peak = 0.25 * vel
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(peak, time + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.95)

    const gain2 = this.ctx.createGain()
    const peak2 = 0.08 * vel
    gain2.gain.setValueAtTime(0, time)
    gain2.gain.linearRampToValueAtTime(peak2, time + 0.002)
    gain2.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.5)

    osc.connect(gain).connect(this.filter)
    osc2.connect(gain2).connect(this.filter)

    osc.start(time); osc.stop(time + dur)
    osc2.start(time); osc2.stop(time + dur)
  },

  _tick() {
    if (!this.isPlaying || !this.ctx) return
    const stepDur = (60 / this._bpm) * 0.5  // 8 分音符为 1 步
    while (this._nextStepTime < this.ctx.currentTime + 0.2) {
      for (const [s, note, durSym, vel] of this._pattern) {
        if (s === this._stepIdx) {
          const beats = DUR_TO_BEATS[durSym] || 0.5
          this._playNote(note, this._nextStepTime, beats, vel)
        }
      }
      this._nextStepTime += stepDur
      this._stepIdx = (this._stepIdx + 1) % this._stepsPerLoop
    }
    this._timer = setTimeout(() => this._tick(), 25)
  },

  async play() {
    await this.init()
    if (this.ctx.state === 'suspended') await this.ctx.resume()
    if (!this._pattern) {
      this._setPattern(this._pendingWeather || 'sunny')
      this._pendingWeather = null
    }
    if (!this.isPlaying) {
      this._nextStepTime = this.ctx.currentTime + 0.05
      this.isPlaying = true
      this._tick()
    }
  },

  pause() {
    this.isPlaying = false
    if (this._timer) { clearTimeout(this._timer); this._timer = null }
  },

  toggle() {
    return this.isPlaying ? this.pause() : this.play()
  },

  setVolume(v) {
    if (!this.master) return
    v = Math.max(0, Math.min(1, v))
    this.master.gain.linearRampToValueAtTime(v * 0.5, 0.05)
  }
}
