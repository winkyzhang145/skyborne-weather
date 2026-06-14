// 顶级 Lo-Fi Piano BGM
// 采样：Salamander Grand Piano（CC0 公共领域，tonejs.github.io 标准采样）
// 处理链：Salamander Sampler → LowPass(8kHz) → Chorus → Reverb → Volume
// 6 种天气对应 6 段 pattern / 调性 / BPM

import * as Tone from 'tone'

const SAMPLER_BASE = 'https://tonejs.github.io/audio/salamander/'

// 采样音符（每个八度 3 个 + 高音区 1 个，足以覆盖所有 pattern）
const SAMPLER_NOTES = {
  A1: 'A1.mp3', A2: 'A2.mp3', A3: 'A3.mp3', A4: 'A4.mp3', A5: 'A5.mp3', C2: 'C2.mp3', C3: 'C3.mp3',
  'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3', A6: 'A6.mp3', C1: 'C1.mp3', C4: 'C4.mp3', C5: 'C5.mp3',
  'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', D1: 'D1.mp3', D2: 'D2.mp3',
  D3: 'D3.mp3', D4: 'D4.mp3', D5: 'D5.mp3', D6: 'D6.mp3', E1: 'E1.mp3', E2: 'E2.mp3', E3: 'E3.mp3',
  E4: 'E4.mp3', E5: 'E5.mp3', E6: 'E6.mp3', F1: 'F1.mp3', F2: 'F2.mp3', F3: 'F3.mp3', F4: 'F4.mp3',
  F5: 'F5.mp3', G1: 'G1.mp3', G2: 'G2.mp3', G3: 'G3.mp3', G4: 'G4.mp3', G5: 'G5.mp3', G6: 'G6.mp3',
  A0: 'A0.mp3', C6: 'C6.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3', 'C7': 'C7.mp3',
  'D#1': 'Ds1.mp3', 'D#6': 'Ds6.mp3', 'D#7': 'Ds7.mp3', 'F#1': 'Fs1.mp3', 'F#6': 'Fs6.mp3', 'F#7': 'Fs7.mp3',
  A7: 'A7.mp3', 'D#8': 'Ds8.mp3', 'F#8': 'Fs8.mp3'
}

// 6 种天气 → 6 套音乐设计
// 用简谱记号（Do=C），转 MIDI 后给 Sampler
const NOTE = (s) => Tone.Frequency(s).toFrequency()  // "C4" / "E4" 等

const PATTERNS = {
  // 晴：C 大调上行琶音，明亮欢快
  sunny: {
    bpm: 96,
    scale: ['C5', 'E5', 'G5', 'C6', 'B5', 'A5', 'G5', 'E5'],
    pattern: [
      // [step, note, duration, velocity]
      [0, 'C5', '8n', 0.7],
      [1, 'E5', '8n', 0.6],
      [2, 'G5', '8n', 0.7],
      [3, 'C6', '4n', 0.8],
      [4, 'E5', '8n', 0.55],
      [5, 'G5', '8n', 0.6],
      [6, 'B5', '8n', 0.65],
      [7, 'A5', '4n', 0.7]
    ]
  },
  // 少云/晴间多云：F 大调，柔和 4 步
  partly: {
    bpm: 80,
    scale: ['F4', 'A4', 'C5', 'F5'],
    pattern: [
      [0, 'F4', '4n', 0.55],
      [2, 'A4', '4n', 0.5],
      [4, 'C5', '4n', 0.6],
      [6, 'F5', '2n', 0.65]
    ]
  },
  // 阴：A 小调，少音慵懒
  cloudy: {
    bpm: 70,
    scale: ['A3', 'C4', 'E4', 'A4'],
    pattern: [
      [0, 'A3', '2n', 0.5],
      [2, 'C4', '4n', 0.45],
      [4, 'E4', '4n', 0.5],
      [6, 'A4', '1n', 0.6]
    ]
  },
  // 雨：A 小调下行 + 装饰音，颗粒感
  rainy: {
    bpm: 72,
    scale: ['A3', 'C4', 'E4', 'G4', 'E4', 'C4'],
    pattern: [
      [0,  'A4', '8n', 0.6],
      [0.5,'G4', '16n', 0.4],
      [1,  'E4', '8n', 0.55],
      [2,  'C4', '8n', 0.5],
      [2.5,'D4', '16n', 0.4],
      [3,  'E4', '4n', 0.6],
      [4,  'C4', '8n', 0.45],
      [5,  'A3', '4n', 0.55],
      [6,  'E4', '4n', 0.5],
      [7,  'A3', '2n', 0.6]
    ]
  },
  // 雪：C 大调高音区，缓慢空灵
  snowy: {
    bpm: 60,
    scale: ['C6', 'E6', 'G6', 'C7'],
    pattern: [
      [0, 'C6', '2n', 0.5],
      [2, 'E6', '2n', 0.55],
      [4, 'G6', '2n', 0.6],
      [6, 'C7', '1n', 0.65]
    ]
  },
  // 雾：极简 + 长延音
  foggy: {
    bpm: 50,
    scale: ['C4', 'G4'],
    pattern: [
      [0, 'C4', '1n', 0.45],
      [4, 'G4', '1n', 0.5]
    ]
  }
}

export const musicbox = {
  sampler: null,
  reverb: null,
  chorus: null,
  filter: null,
  vol: null,
  loop: null,
  currentWeather: null,
  isPlaying: false,
  isReady: false,
  _pendingWeather: null,
  _pendingPlay: false,

  async init() {
    if (this.sampler) return
    // 顶层：滤波器 + 混响 + 音量
    this.filter = new Tone.Filter(8000, 'lowpass').toDestination()
    this.reverb = new Tone.Reverb({ decay: 4, wet: 0.35 }).connect(this.filter)
    this.chorus = new Tone.Chorus({ frequency: 1.5, depth: 0.6, wet: 0.25 }).connect(this.reverb)
    this.vol = new Tone.Volume(-6).connect(this.chorus)

    // Salamander 采样（CC0）
    this.sampler = new Tone.Sampler({
      urls: SAMPLER_NOTES,
      baseUrl: SAMPLER_BASE,
      release: 1.2,
      attack: 0.005
    }).connect(this.vol)

    // 等待采样加载完成
    await Tone.loaded()
    this.isReady = true

    if (this._pendingWeather) {
      this._setPattern(this._pendingWeather)
      this._pendingWeather = null
    }
    if (this._pendingPlay) {
      await this.play()
      this._pendingPlay = false
    }
  },

  setWeather(weather) {
    if (!weather) return
    if (!this.isReady) {
      this._pendingWeather = weather
      return
    }
    this._setPattern(weather)
  },

  _setPattern(weather) {
    if (this.currentWeather === weather && this.loop) return
    const cfg = PATTERNS[weather] || PATTERNS.sunny
    if (this.loop) {
      this.loop.dispose()
      this.loop = null
    }
    Tone.getTransport().bpm.value = cfg.bpm
    this.loop = new Tone.Loop((time) => {
      for (const [step, note, dur, vel] of cfg.pattern) {
        this.sampler.triggerAttackRelease(note, dur, time + step * Tone.Time('8n').toSeconds(), vel)
      }
    }, '8m').start(0)
    this.currentWeather = weather
  },

  async play() {
    if (!this.isReady) {
      await this.init()
    }
    if (Tone.getContext().state !== 'running') {
      await Tone.start()
    }
    if (!this.loop && this.currentWeather) {
      this._setPattern(this.currentWeather)
    } else if (!this.loop && this._pendingWeather) {
      this._setPattern(this._pendingWeather)
      this._pendingWeather = null
    } else if (!this.loop) {
      this._setPattern('sunny')
    }
    if (Tone.getTransport().state !== 'started') {
      Tone.getTransport().start()
    }
    this.isPlaying = true
  },

  pause() {
    if (this.loop) this.loop.stop()
    Tone.getTransport().stop()
    this.isPlaying = false
  },

  toggle() {
    return this.isPlaying ? this.pause() : this.play()
  },

  setVolume(v) {
    // v: 0..1 → -40..0 dB
    if (!this.vol) return
    this.vol.volume.rampTo(v <= 0 ? -40 : -30 + v * 30, 0.1)
  }
}
