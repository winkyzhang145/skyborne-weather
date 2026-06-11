// 3D 场景主模块 · 糖果仙境
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

import { createStars } from './stars.js?v=5'
import { createEarthArc } from './earthArc.js?v=5'
import { createWeatherOrb } from './orb.js?v=5'
import { createParticles } from './particles.js?v=5'
import { createClouds } from './clouds.js?v=5'
import { VignetteShader } from './shaders.js?v=5'

export class WeatherScene {
  constructor(canvas) {
    this.canvas = canvas
    this.clock = new THREE.Clock()
    this.weatherState = 'sunny'
    // 糖果仙境调色板 - 主导色 + 暖色
    this.colorPalettes = {
      sunny: { sky1: 0x87CEEB, sky2: 0xFFD8E8, sun: 0xFFD23F, fog: 0xFFE5EC, amb: 0xFFE5EC, dir: 0xFFE5B5 },
      partly:{ sky1: 0xA5DEF5, sky2: 0xE8D5F2, sun: 0xFFB5D8, fog: 0xFFF0F5, amb: 0xFFD8E8, dir: 0xFFE5D5 },
      cloudy:{ sky1: 0xC5D9F1, sky2: 0xD8C9E8, sun: 0xC5A3FF, fog: 0xEFE8F5, amb: 0xD5DEED, dir: 0xE8DCEE },
      rainy: { sky1: 0x87CEEB, sky2: 0xB8D8E8, sun: 0x4DD0B5, fog: 0xD8E8F0, amb: 0xB8D8E8, dir: 0xC5E5E0 },
      snowy: { sky1: 0xB8D8F0, sky2: 0xD5DEED, sun: 0xEAF6FF, fog: 0xEEF2F8, amb: 0xD5DEED, dir: 0xE5E5F0 },
      foggy: { sky1: 0xD5DEED, sky2: 0xE8DCEE, sun: 0xFFD8E8, fog: 0xF2E8F0, amb: 0xE8DCEE, dir: 0xF2E8F0 }
    }

    this.init()
  }

  init() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xFFE5EC)
    this.scene.fog = new THREE.FogExp2(0xFFE5EC, 0.015)

    this.camera = new THREE.PerspectiveCamera(
      50, window.innerWidth / window.innerHeight, 0.1, 200
    )
    this.camera.position.set(0, 1.8, 9)
    this.camera.lookAt(0, 0.2, 0)

    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.06
    this.controls.enablePan = false
    this.controls.minDistance = 6
    this.controls.maxDistance = 14
    this.controls.minPolarAngle = Math.PI * 0.3
    this.controls.maxPolarAngle = Math.PI * 0.7
    this.controls.target.set(0, 0.2, 0)
    this.controls.autoRotate = true
    this.controls.autoRotateSpeed = 0.4

    this.setupLights()

    this.stars = createStars(this.scene)
    this.earthArc = createEarthArc(this.scene)
    this.clouds = createClouds(this.scene)
    this.orb = createWeatherOrb(this.scene)
    this.particles = createParticles(this.scene)

    this.composer = new EffectComposer(this.renderer)
    this.composer.setSize(window.innerWidth, window.innerHeight)
    this.composer.addPass(new RenderPass(this.scene, this.camera))

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.4, 0.8, 0.7
    )
    this.composer.addPass(bloom)
    this.bloom = bloom

    const vignette = new ShaderPass(VignetteShader)
    vignette.uniforms.offset.value = 1.2
    vignette.uniforms.darkness.value = 0.4
    this.composer.addPass(vignette)

    this.composer.addPass(new OutputPass())

    this.onResize = this.onResize.bind(this)
    window.addEventListener('resize', this.onResize)

    this.animate()
  }

  setupLights() {
    this.ambient = new THREE.AmbientLight(0xFFE5EC, 0.95)
    this.scene.add(this.ambient)

    this.sun = new THREE.DirectionalLight(0xFFE5B5, 1.4)
    this.sun.position.set(5, 6, 4)
    this.scene.add(this.sun)

    this.rim = new THREE.DirectionalLight(0xFFB5D8, 0.55)
    this.rim.position.set(-4, 2, -3)
    this.scene.add(this.rim)

    this.top = new THREE.DirectionalLight(0xB5E5FF, 0.5)
    this.top.position.set(0, 8, 0)
    this.scene.add(this.top)

    this.corePoint = new THREE.PointLight(0xFFD23F, 1.5, 8, 1.5)
    this.corePoint.position.set(0, 0.5, 0)
    this.scene.add(this.corePoint)
  }

  setWeatherState(state) {
    if (this.weatherState === state) return
    this.weatherState = state

    const p = this.colorPalettes[state] || this.colorPalettes.sunny
    this.transitionFog(p.fog)
    this.transitionLights(p.sun, p.amb, p.dir)
    this.orb.setState(state, this.colorPalettes)
    this.particles.setState(state)
    this.clouds.setState(state)
  }

  setCityName(name) {
    this.orb.setCityName(name)
  }

  focusHour(idx) {
    this.orb.focusHour(idx)
  }

  // 昼夜循环：0~1 (0=午夜, 0.5=正午)
  setTimeOfDay(tod) {
    this.orb.setTimeOfDay(tod)
    // 调整背景与灯光色调
    let bg, ambHex
    if (tod < 0.2 || tod > 0.8) {
      // 夜晚
      bg = 0x2A1F4A
      ambHex = 0x4A4070
    } else if (tod < 0.3 || tod > 0.7) {
      // 黄昏
      bg = 0xFFB4A2
      ambHex = 0xFFD8B5
    } else if (tod < 0.4 || tod > 0.6) {
      // 早晨/傍晚
      bg = 0xFFE5D5
      ambHex = 0xFFE5EC
    } else {
      // 正午
      bg = 0xFFE5EC
      ambHex = 0xFFE5EC
    }
    this.transitionFog(bg)
    this.transitionAmbient(ambHex)
  }

  transitionAmbient(ambHex) {
    const target = new THREE.Color(ambHex)
    const start = this.ambient.color.clone()
    const duration = 1500
    const t0 = performance.now()
    const tick = () => {
      const t = Math.min(1, (performance.now() - t0) / duration)
      this.ambient.color.copy(start).lerp(target, t)
      if (this.scene.background) this.scene.background.copy(this.ambient.color)
      if (t < 1) requestAnimationFrame(tick)
    }
    tick()
  }

  transitionFog(targetHex) {
    if (!this.scene.fog) return
    const target = new THREE.Color(targetHex)
    const start = this.scene.fog.color.clone()
    const duration = 1200
    const t0 = performance.now()
    const tick = () => {
      const t = Math.min(1, (performance.now() - t0) / duration)
      this.scene.fog.color.copy(start).lerp(target, t)
      if (this.scene.background) this.scene.background.copy(this.scene.fog.color)
      if (t < 1) requestAnimationFrame(tick)
    }
    tick()
  }

  transitionLights(targetSun, ambHex, dirHex) {
    const target = new THREE.Color(targetSun)
    const startSun = this.sun.color.clone()
    const startCore = this.corePoint.color.clone()
    const startAmb = this.ambient.color.clone()
    const startRim = this.rim.color.clone()
    const targetAmb = new THREE.Color(ambHex)
    const targetRim = new THREE.Color(dirHex)
    const duration = 1200
    const t0 = performance.now()
    const tick = () => {
      const t = Math.min(1, (performance.now() - t0) / duration)
      this.sun.color.copy(startSun).lerp(target, t)
      this.corePoint.color.copy(startCore).lerp(target, t)
      this.ambient.color.copy(startAmb).lerp(targetAmb, t)
      this.rim.color.copy(startRim).lerp(targetRim, t)
      if (t < 1) requestAnimationFrame(tick)
    }
    tick()
  }

  animate() {
    requestAnimationFrame(() => this.animate())
    const dt = this.clock.getDelta()
    const t = this.clock.elapsedTime

    this.controls.update()
    this.stars.update(t)
    this.earthArc.update(t)
    this.clouds.update(t)
    this.orb.update(t, dt)
    this.particles.update(t, dt)

    this.corePoint.intensity = 1.3 + Math.sin(t * 1.5) * 0.3

    this.composer.render()
  }

  onResize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.composer.setSize(w, h)
    this.bloom.setSize(w, h)
  }

  dispose() {
    window.removeEventListener('resize', this.onResize)
    this.renderer.dispose()
  }
}
