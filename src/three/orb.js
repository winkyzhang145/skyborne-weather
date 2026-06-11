// 中央糖果装置：多级底座 + 8 根糖果柱 + 机械臂 + 玻璃穹顶（内含天气符号）+ 齿轮 + 旗子
import * as THREE from 'three'

export function createWeatherOrb(scene) {
  const group = new THREE.Group()
  group.position.set(0, 0, 0)

  // ============ 暗色舞台底盘（让装置从亮背景中"立"起来）============
  const stage = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 3.4, 0.3, 48),
    new THREE.MeshStandardMaterial({ color: 0x6B3A4A, roughness: 0.85, metalness: 0.1 })
  )
  stage.position.y = -1.65
  stage.receiveShadow = true
  group.add(stage)

  const stageRing = new THREE.Mesh(
    new THREE.TorusGeometry(3.0, 0.05, 8, 48),
    new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9, roughness: 0.3 })
  )
  stageRing.position.y = -1.5
  stageRing.rotation.x = Math.PI / 2
  group.add(stageRing)

  // ============ 多层蛋糕底座 ============
  const baseMat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.2 })
  const cake1 = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 0.4, 32), baseMat(0xFF8FB5))
  cake1.position.y = -1.4
  cake1.castShadow = true
  group.add(cake1)

  const cake1Top = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.1, 32), baseMat(0xFFE5EC))
  cake1Top.position.y = -1.15
  group.add(cake1Top)

  const cake2 = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.85, 0.3, 32), baseMat(0xFFD8E8))
  cake2.position.y = -0.92
  cake2.castShadow = true
  group.add(cake2)

  const cake2Top = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.08, 32), baseMat(0x8B4513))
  cake2Top.position.y = -0.73
  group.add(cake2Top)

  // 底座小灯笼/花环 - 围一圈
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const r = 1.95
    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 8),
      new THREE.MeshStandardMaterial({
        color: i % 3 === 0 ? 0xFFD23F : (i % 3 === 1 ? 0xFF6B9D : 0x4DD0B5),
        emissive: i % 3 === 0 ? 0xFFD23F : (i % 3 === 1 ? 0xFF6B9D : 0x4DD0B5),
        emissiveIntensity: 0.3
      })
    )
    lantern.position.set(Math.cos(a) * r, -1.2, Math.sin(a) * r)
    group.add(lantern)
  }

  // ============ 8 根糖果手杖柱 ============
  const caneColors = [
    0xFFB5D8, 0xB5E5FF, 0xC5F4D8, 0xFFE5B5,
    0xE5C5FF, 0xFFD8B5, 0xFFB5C5, 0xC5E5FF
  ]
  const poles = []
  for (let i = 0; i < 8; i++) {
    const pole = createCandyCane(caneColors[i], 0xFFFFFF)
    const angle = (i / 8) * Math.PI * 2
    const dist = 1.15 + (i % 2 === 0 ? 0 : 0.15)
    pole.position.set(Math.cos(angle) * dist, -0.6, Math.sin(angle) * dist)
    pole.rotation.y = -angle + Math.PI / 2
    pole.rotation.z = (i % 2 === 0 ? 0.15 : -0.15)
    group.add(pole)
    poles.push({ mesh: pole, baseColor: caneColors[i], angle, dist })
  }

  // ============ 机械臂/连接管（环形轨道）============
  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.05, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0xD4A574, metalness: 0.9, roughness: 0.3 })
  )
  ring1.position.y = 0.2
  ring1.rotation.x = Math.PI / 2
  group.add(ring1)

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.04, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.95, roughness: 0.2 })
  )
  ring2.position.y = 0.6
  ring2.rotation.x = Math.PI / 2
  group.add(ring2)

  // 旗子 - 围在 ring2 上
  const flags = []
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const r = 1.5
    const flagGroup = createFlag(caneColors[i % caneColors.length])
    flagGroup.position.set(Math.cos(a) * r, 0.6, Math.sin(a) * r)
    flagGroup.rotation.y = -a
    flagGroup.userData = { offset: i, baseY: 0.6 }
    group.add(flagGroup)
    flags.push(flagGroup)
  }

  // ============ 中心玻璃穹顶 ============
  const domeGlass = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.3,
      roughness: 0.05,
      metalness: 0.0,
      transmission: 0.92,
      ior: 1.4,
      thickness: 0.5,
      side: THREE.DoubleSide
    })
  )
  domeGlass.position.y = 0.5
  group.add(domeGlass)

  // 玻璃穹顶金底圈
  const domeRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.65, 0.05, 12, 32),
    new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.95, roughness: 0.2 })
  )
  domeRing.position.y = 0.5
  domeRing.rotation.x = Math.PI / 2
  group.add(domeRing)

  // ============ 穹顶内：天气符号 + 核心球 ============
  const weatherSymbolGroup = new THREE.Group()
  weatherSymbolGroup.position.y = 0.3
  group.add(weatherSymbolGroup)

  // 内部核心球 - 高亮发光
  const coreOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 32, 24),
    new THREE.MeshStandardMaterial({
      color: 0xFFD23F,
      emissive: 0xFF6B9D,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.4
    })
  )
  coreOrb.position.y = 0
  group.add(coreOrb)

  // 核心球外发光光晕
  const coreGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 12),
    new THREE.MeshBasicMaterial({
      color: 0xFFB5D8,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  )
  coreGlow.position.y = 0
  group.add(coreGlow)

  // 天气符号（3D 形状）- 初始为太阳
  let currentWeatherSymbol = null
  function createWeatherSymbol3D(state) {
    if (currentWeatherSymbol) {
      weatherSymbolGroup.remove(currentWeatherSymbol)
      currentWeatherSymbol.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose() })
    }
    const sg = new THREE.Group()
    if (state === 'sunny') {
      // 太阳：中心圆 + 8 根光线
      const sun = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 24, 16),
        new THREE.MeshStandardMaterial({ color: 0xFFD23F, emissive: 0xFFD23F, emissiveIntensity: 0.8, roughness: 0.3 })
      )
      sg.add(sun)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        const ray = new THREE.Mesh(
          new THREE.ConeGeometry(0.04, 0.18, 6),
          new THREE.MeshStandardMaterial({ color: 0xFFE066, emissive: 0xFFD23F, emissiveIntensity: 0.6 })
        )
        ray.position.set(Math.cos(a) * 0.28, 0, Math.sin(a) * 0.28)
        ray.rotation.z = -a + Math.PI / 2
        sg.add(ray)
      }
    } else if (state === 'rainy') {
      // 云 + 雨滴
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xC5D9F1, roughness: 0.8 })
      )
      cloud.position.y = 0.08
      sg.add(cloud)
      const cloud2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xC5D9F1, roughness: 0.8 })
      )
      cloud2.position.set(0.12, 0.06, 0)
      sg.add(cloud2)
      for (let i = 0; i < 5; i++) {
        const drop = new THREE.Mesh(
          new THREE.ConeGeometry(0.025, 0.1, 6),
          new THREE.MeshStandardMaterial({ color: 0x5CC8FF, emissive: 0x5CC8FF, emissiveIntensity: 0.3 })
        )
        drop.position.set(-0.15 + i * 0.075, -0.15, 0)
        drop.rotation.x = Math.PI
        sg.add(drop)
      }
    } else if (state === 'snowy') {
      // 雪花 - 6 角
      const flake = new THREE.Group()
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI
        const arm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.012, 0.012, 0.3, 4),
          new THREE.MeshStandardMaterial({ color: 0xEAF6FF, emissive: 0xEAF6FF, emissiveIntensity: 0.3 })
        )
        arm.rotation.z = a
        flake.add(arm)
      }
      sg.add(flake)
    } else if (state === 'cloudy') {
      // 多云
      const c1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xE8D5F2, roughness: 0.8 })
      )
      c1.position.set(-0.1, 0, 0)
      sg.add(c1)
      const c2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xD8C9E8, roughness: 0.8 })
      )
      c2.position.set(0.1, 0.05, 0)
      sg.add(c2)
    } else if (state === 'foggy') {
      // 雾：三层水平圆环
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.18 - i * 0.04, 0.015, 6, 24),
          new THREE.MeshStandardMaterial({ color: 0xE8DCEE, transparent: true, opacity: 0.7 })
        )
        ring.position.y = (i - 1) * 0.06
        sg.add(ring)
      }
    } else {
      // partly 多云
      const sun = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xFFD23F, emissive: 0xFFD23F, emissiveIntensity: 0.6 })
      )
      sun.position.set(-0.08, 0.08, 0)
      sg.add(sun)
      const c1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xFFE5EC, roughness: 0.8 })
      )
      c1.position.set(0.08, -0.05, 0)
      sg.add(c1)
    }
    weatherSymbolGroup.add(sg)
    currentWeatherSymbol = sg
    return sg
  }
  createWeatherSymbol3D('sunny')

  // ============ 多个齿轮（不同位置）============
  const gears = []
  const gearConfigs = [
    { x: -1.3, y: -0.4, z: 0.5, r: 0.22, teeth: 8, color: 0xD4A574, speed: 0.3 },
    { x: 1.3, y: -0.4, z: 0.5, r: 0.22, teeth: 8, color: 0xD4A574, speed: -0.3 },
    { x: 0, y: 0.2, z: 1.4, r: 0.18, teeth: 6, color: 0xC0A062, speed: 0.5 },
    { x: 0, y: 0.2, z: -1.4, r: 0.18, teeth: 6, color: 0xC0A062, speed: -0.5 },
    { x: 0.7, y: 0.7, z: 0.9, r: 0.14, teeth: 6, color: 0xFFD700, speed: 0.7 },
    { x: -0.7, y: 0.7, z: 0.9, r: 0.14, teeth: 6, color: 0xFFD700, speed: -0.7 }
  ]
  gearConfigs.forEach(g => {
    const gear = createGear(g.color, g.r, g.teeth)
    gear.position.set(g.x, g.y, g.z)
    gear.userData = { speed: g.speed }
    group.add(gear)
    gears.push(gear)
  })

  // ============ 顶部金尖 + 大彩球 ============
  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.6, 12),
    new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.95, roughness: 0.2 })
  )
  spire.position.y = 1.55
  group.add(spire)

  const spireBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 20, 16),
    new THREE.MeshStandardMaterial({
      color: 0xFF6B9D,
      emissive: 0xFF6B9D,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.4
    })
  )
  spireBall.position.y = 1.95
  group.add(spireBall)

  // 顶部小球光环
  const spireRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.02, 6, 24),
    new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9, roughness: 0.2 })
  )
  spireRing.position.y = 1.95
  spireRing.rotation.x = Math.PI / 2
  group.add(spireRing)

  // ============ 城市旗帜/横幅（在底座上）============
  let cityBanner = createCityBanner('北京')
  cityBanner.position.set(0, 0.05, 1.85)
  group.add(cityBanner)

  // ============ 装饰球环绕（彩色气球）============
  const ornaments = []
  const ornamentColors = [0xFFD23F, 0x4DD0B5, 0xA5DEF5, 0xC5A3FF, 0xFFB5D8, 0xFFE5B5]
  for (let i = 0; i < 10; i++) {
    const om = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 8),
      new THREE.MeshStandardMaterial({
        color: ornamentColors[i % ornamentColors.length],
        emissive: ornamentColors[i % ornamentColors.length],
        emissiveIntensity: 0.3,
        roughness: 0.3,
        metalness: 0.4
      })
    )
    const a = (i / 10) * Math.PI * 2
    const r = 1.7
    om.userData = { angle: a, r, baseY: 0.3 + (i % 4) * 0.25, speed: 0.4 + i * 0.08, offset: i }
    om.position.set(Math.cos(a) * r, om.userData.baseY, Math.sin(a) * r)
    group.add(om)
    ornaments.push(om)
  }

  // ============ 周围小型糖果建筑（远处装饰）============
  const miniStructures = []
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 0.3
    const dist = 2.6
    const s = createMiniCandyTower(caneColors[i % caneColors.length])
    s.position.set(Math.cos(angle) * dist, -1.4, Math.sin(angle) * dist)
    s.rotation.y = -angle
    group.add(s)
    miniStructures.push(s)
  }

  scene.add(group)

  return {
    group,
    update(t, dt) {
      // 整体呼吸
      const breathe = 1 + Math.sin(t * 0.8) * 0.02
      group.scale.setScalar(breathe)
      group.position.y = Math.sin(t * 0.6) * 0.08

      // 核心球自转
      coreOrb.rotation.y = t * 0.5
      coreOrb.rotation.x = t * 0.3

      // 顶球摆动 + 光环
      spireBall.position.x = Math.sin(t * 0.8) * 0.05
      spireRing.rotation.z = t * 0.3

      // 天气符号缓慢转动
      if (currentWeatherSymbol) {
        currentWeatherSymbol.rotation.y = t * 0.4
      }

      // 旗子摆动
      flags.forEach(f => {
        f.rotation.z = Math.sin(t * 1.5 + f.userData.offset) * 0.15
      })

      // 装饰球环绕
      ornaments.forEach(o => {
        const d = o.userData
        const a = d.angle + t * 0.25
        o.position.x = Math.cos(a) * d.r
        o.position.z = Math.sin(a) * d.r
        o.position.y = d.baseY + Math.sin(t * d.speed + d.offset) * 0.18
      })

      // 齿轮旋转
      gears.forEach(g => {
        g.rotation.z += g.userData.speed * dt
      })

      // 圆环反向慢转
      ring1.rotation.z = t * 0.05
      ring2.rotation.z = -t * 0.08
    },
    setState(state, palettes) {
      const p = palettes[state] || palettes.sunny
      const sun = new THREE.Color(p.sun)
      coreOrb.material.color = sun.clone()
      coreOrb.material.emissive = sun.clone()
      spireBall.material.color = sun.clone()
      spireBall.material.emissive = sun.clone()
      cake1.material.color = sun.clone()

      // 切换天气符号
      createWeatherSymbol3D(state)
    },
    setCityName(name) {
      // 销毁旧 banner
      cityBanner.traverse(o => {
        if (o.geometry) o.geometry.dispose()
        if (o.material) {
          if (o.material.map) o.material.map.dispose()
          o.material.dispose()
        }
      })
      group.remove(cityBanner)
      // 创建新 banner
      cityBanner = createCityBanner(name)
      cityBanner.position.set(0, 0.05, 1.85)
      group.add(cityBanner)
    },
    setTimeOfDay(tod) {
      // tod: 0~1 (0=午夜, 0.5=正午)
      // 调整背景色与装置色
      const dayNight = tod < 0.25 || tod > 0.75 ? 'night' : (tod < 0.4 || tod > 0.6 ? 'sunset' : 'day')
      const colors = {
        day: { spire: 0xFFD700, core: 0xFF6B9D },
        sunset: { spire: 0xFF8C42, core: 0xC44569 },
        night: { spire: 0xC5A3FF, core: 0x4A3260 }
      }
      const c = colors[dayNight]
      spireBall.material.color = new THREE.Color(c.spire)
      spireBall.material.emissive = new THREE.Color(c.spire)
      coreOrb.material.color = new THREE.Color(c.core)
      coreOrb.material.emissive = new THREE.Color(c.core)
    },
    focusHour(idx) {
      // 点击小时卡：装置高亮该时刻对应的"装饰球"
      ornaments.forEach((o, i) => {
        if (i === idx) {
          o.scale.setScalar(2.2)
          o.material.emissiveIntensity = 0.9
        } else {
          o.scale.setScalar(1.0)
          o.material.emissiveIntensity = 0.3
        }
      })
      // 短暂让齿轮加速转动
      gears.forEach(g => { g.userData.speed *= 3 })
      setTimeout(() => {
        gears.forEach((g, i) => {
          const cfg = gearConfigs[i]
          g.userData.speed = cfg.speed
        })
      }, 800)
    }
  }
}

// ============ 糖果手杖 ============
function createCandyCane(mainColor, stripeColor) {
  const group = new THREE.Group()
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.5, 0),
    new THREE.Vector3(0, 1.0, 0),
    new THREE.Vector3(0.12, 1.3, 0),
    new THREE.Vector3(0.28, 1.55, 0)
  ])
  const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.08, 12, false)
  const colors = []
  const positions = tubeGeo.attributes.position
  const mainC = new THREE.Color(mainColor)
  const stripeC = new THREE.Color(stripeColor)
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i)
    const phase = y * 10
    const useStripe = Math.sin(phase) > 0
    const c = useStripe ? stripeC : mainC
    colors.push(c.r, c.g, c.b)
  }
  tubeGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  const tubeMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.3,
    metalness: 0.05
  })
  const tube = new THREE.Mesh(tubeGeo, tubeMat)
  tube.castShadow = true
  group.add(tube)

  // 顶端球
  const topBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 12),
    new THREE.MeshStandardMaterial({
      color: mainColor,
      emissive: mainColor,
      emissiveIntensity: 0.3,
      roughness: 0.2
    })
  )
  topBall.position.set(0.28, 1.55, 0)
  group.add(topBall)

  return group
}

// ============ 齿轮 ============
function createGear(color, radius, teeth) {
  const shape = new THREE.Shape()
  const innerR = radius * 0.85
  const outerR = radius
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2
    const r = i % 2 === 0 ? outerR : innerR
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const hole = new THREE.Path()
  hole.absarc(0, 0, radius * 0.25, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 })
  geo.center()
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness: 0.3 })
  return new THREE.Mesh(geo, mat)
}

// ============ 旗子 ============
function createFlag(color) {
  const group = new THREE.Group()
  // 旗杆
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.7 })
  )
  pole.position.y = 0.1
  group.add(pole)
  // 旗面
  const flagGeo = new THREE.PlaneGeometry(0.2, 0.15)
  const flagMat = new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
    roughness: 0.6
  })
  const flag = new THREE.Mesh(flagGeo, flagMat)
  flag.position.set(0.12, 0.18, 0)
  flag.rotation.y = -Math.PI / 2
  group.add(flag)
  return group
}

// ============ 城市旗帜（在底座上）============
function createCityBanner(name) {
  const group = new THREE.Group()
  // 立柱
  const pole1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.7 })
  )
  pole1.position.set(-0.2, 0.3, 0)
  group.add(pole1)
  const pole2 = pole1.clone()
  pole2.position.x = 0.2
  group.add(pole2)
  // 横幅布（用 Canvas 画文字）
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FF6B9D'
  ctx.fillRect(0, 0, 256, 64)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 32px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name, 128, 36)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  group.userData.texture = tex
  const bannerMat = new THREE.MeshStandardMaterial({
    map: tex,
    side: THREE.DoubleSide,
    roughness: 0.7
  })
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.2), bannerMat)
  banner.position.set(0, 0.55, 0)
  group.add(banner)
  return group
}

// ============ 小型糖果塔（远处装饰）============
function createMiniCandyTower(color) {
  const group = new THREE.Group()
  // 底座
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.2, 12),
    new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 })
  )
  base.position.y = 0
  group.add(base)
  // 杆
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2, roughness: 0.4 })
  )
  pole.position.y = 0.35
  group.add(pole)
  // 顶端小糖果
  const top = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xFFD23F, emissive: 0xFFD23F, emissiveIntensity: 0.4, roughness: 0.3 })
  )
  top.position.y = 0.7
  group.add(top)
  return group
}
