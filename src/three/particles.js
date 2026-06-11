// 糖果仙境粒子：彩色糖豆雨 / 花瓣雪 / 彩虹雾 / 漂浮心
import * as THREE from 'three'

export function createParticles(scene) {
  const group = new THREE.Group()

  // 雨粒子 - 多色糖豆
  const RAIN_COUNT = 1200
  const rainGeo = new THREE.BufferGeometry()
  const rainPos = new Float32Array(RAIN_COUNT * 3)
  const rainCol = new Float32Array(RAIN_COUNT * 3)
  const rainVel = new Float32Array(RAIN_COUNT)
  const rainPalette = [0xFFB5D8, 0xB5E5FF, 0xC5F4D8, 0xFFE5B5, 0xE5C5FF]
  for (let i = 0; i < RAIN_COUNT; i++) {
    rainPos[i * 3]     = (Math.random() - 0.5) * 14
    rainPos[i * 3 + 1] = Math.random() * 10 - 1
    rainPos[i * 3 + 2] = (Math.random() - 0.5) * 12
    const c = new THREE.Color(rainPalette[i % rainPalette.length])
    rainCol[i * 3]     = c.r
    rainCol[i * 3 + 1] = c.g
    rainCol[i * 3 + 2] = c.b
    rainVel[i] = 0.15 + Math.random() * 0.1
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3))
  rainGeo.setAttribute('color', new THREE.BufferAttribute(rainCol, 3))
  const rainMat = new THREE.PointsMaterial({
    size: 0.10,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.NormalBlending
  })
  const rain = new THREE.Points(rainGeo, rainMat)
  rain.visible = false
  group.add(rain)

  // 雪粒子 - 多彩花瓣
  const SNOW_COUNT = 400
  const snowGeo = new THREE.BufferGeometry()
  const snowPos = new Float32Array(SNOW_COUNT * 3)
  const snowData = new Float32Array(SNOW_COUNT * 3)
  for (let i = 0; i < SNOW_COUNT; i++) {
    snowPos[i * 3]     = (Math.random() - 0.5) * 14
    snowPos[i * 3 + 1] = Math.random() * 10 - 1
    snowPos[i * 3 + 2] = (Math.random() - 0.5) * 12
    snowData[i * 3]     = (Math.random() - 0.5) * 0.008
    snowData[i * 3 + 1] = -0.012 - Math.random() * 0.01
    snowData[i * 3 + 2] = (Math.random() - 0.5) * 0.008
  }
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3))
  const snowMat = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 0.18,
    map: makePetalTexture(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.NormalBlending,
    alphaTest: 0.1
  })
  const snow = new THREE.Points(snowGeo, snowMat)
  snow.visible = false
  group.add(snow)

  // 雾粒子 - 大颗粒柔和
  const FOG_COUNT = 120
  const fogGeo = new THREE.BufferGeometry()
  const fogPos = new Float32Array(FOG_COUNT * 3)
  const fogCol = new Float32Array(FOG_COUNT * 3)
  const fogPalette = [0xFFD8E8, 0xE8D5F2, 0xD5E8F2, 0xFFE5D5]
  for (let i = 0; i < FOG_COUNT; i++) {
    fogPos[i * 3]     = (Math.random() - 0.5) * 16
    fogPos[i * 3 + 1] = Math.random() * 6 - 2
    fogPos[i * 3 + 2] = (Math.random() - 0.5) * 14
    const c = new THREE.Color(fogPalette[i % fogPalette.length])
    fogCol[i * 3]     = c.r
    fogCol[i * 3 + 1] = c.g
    fogCol[i * 3 + 2] = c.b
  }
  fogGeo.setAttribute('position', new THREE.BufferAttribute(fogPos, 3))
  fogGeo.setAttribute('color', new THREE.BufferAttribute(fogCol, 3))
  const fogMat = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.NormalBlending
  })
  const fog = new THREE.Points(fogGeo, fogMat)
  fog.visible = false
  group.add(fog)

  // 阳光粒子 - 金色小星
  const SUN_COUNT = 200
  const sunGeo = new THREE.BufferGeometry()
  const sunPos = new Float32Array(SUN_COUNT * 3)
  for (let i = 0; i < SUN_COUNT; i++) {
    const r = 2 + Math.random() * 6
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1) * 0.5
    sunPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
    sunPos[i * 3 + 1] = r * Math.cos(phi) + 1
    sunPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
  }
  sunGeo.setAttribute('position', new THREE.BufferAttribute(sunPos, 3))
  const sunMat = new THREE.PointsMaterial({
    color: 0xFFD23F,
    size: 0.08,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })
  const sun = new THREE.Points(sunGeo, sunMat)
  sun.visible = false
  group.add(sun)

  scene.add(group)

  let targetRainOpacity = 0
  let targetSnowOpacity = 0
  let targetFogOpacity = 0
  let targetSunOpacity = 0

  return {
    group,
    update(t, dt) {
      rainMat.opacity += (targetRainOpacity - rainMat.opacity) * 0.05
      snowMat.opacity += (targetSnowOpacity - snowMat.opacity) * 0.05
      fogMat.opacity  += (targetFogOpacity  - fogMat.opacity)  * 0.05
      sunMat.opacity  += (targetSunOpacity  - sunMat.opacity)  * 0.05

      // 雨
      if (rainMat.opacity > 0.01) {
        const pos = rainGeo.attributes.position
        for (let i = 0; i < RAIN_COUNT; i++) {
          pos.array[i * 3 + 1] -= rainVel[i]
          pos.array[i * 3] += 0.015
          if (pos.array[i * 3 + 1] < -2) {
            pos.array[i * 3 + 1] = 9
            pos.array[i * 3] = (Math.random() - 0.5) * 14
            pos.array[i * 3 + 2] = (Math.random() - 0.5) * 12
          }
        }
        pos.needsUpdate = true
        rain.visible = true
      } else {
        rain.visible = false
      }

      // 雪
      if (snowMat.opacity > 0.01) {
        const pos = snowGeo.attributes.position
        for (let i = 0; i < SNOW_COUNT; i++) {
          pos.array[i * 3]     += snowData[i * 3] + Math.sin(t * 0.5 + i) * 0.003
          pos.array[i * 3 + 1] += snowData[i * 3 + 1]
          pos.array[i * 3 + 2] += snowData[i * 3 + 2] + Math.cos(t * 0.5 + i) * 0.003
          // 自转（视觉感通过正弦摆动）
          if (pos.array[i * 3 + 1] < -2) {
            pos.array[i * 3]     = (Math.random() - 0.5) * 14
            pos.array[i * 3 + 1] = 9
            pos.array[i * 3 + 2] = (Math.random() - 0.5) * 12
          }
        }
        pos.needsUpdate = true
        snow.visible = true
      } else {
        snow.visible = false
      }

      // 雾
      if (fogMat.opacity > 0.01) {
        const pos = fogGeo.attributes.position
        for (let i = 0; i < FOG_COUNT; i++) {
          pos.array[i * 3]     += Math.sin(t * 0.2 + i) * 0.003
          pos.array[i * 3 + 1] += Math.cos(t * 0.15 + i) * 0.0015
        }
        pos.needsUpdate = true
        fog.visible = true
      } else {
        fog.visible = false
      }

      // 阳光
      if (sunMat.opacity > 0.01) {
        const pos = sunGeo.attributes.position
        for (let i = 0; i < SUN_COUNT; i++) {
          pos.array[i * 3 + 1] += Math.sin(t + i) * 0.002
        }
        pos.needsUpdate = true
        sun.visible = true
      } else {
        sun.visible = false
      }
    },
    setState(state) {
      targetRainOpacity = state === 'rainy' ? 0.9 : 0
      targetSnowOpacity = state === 'snowy' ? 0.95 : 0
      targetFogOpacity  = state === 'foggy' ? 0.5  : (state === 'cloudy' ? 0.2 : 0)
      targetSunOpacity  = state === 'sunny' ? 0.85 : (state === 'partly' ? 0.4 : 0)
    }
  }
}

function makePetalTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  // 6 瓣花
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const x = size / 2 + Math.cos(a) * 12
    const y = size / 2 + Math.sin(a) * 12
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 16)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.6, 'rgba(255,255,255,0.5)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, 16, 0, Math.PI * 2)
    ctx.fill()
  }
  // 中心
  ctx.fillStyle = 'rgba(255,230,180,1)'
  ctx.beginPath()
  ctx.arc(size/2, size/2, 5, 0, Math.PI * 2)
  ctx.fill()
  return new THREE.CanvasTexture(canvas)
}
