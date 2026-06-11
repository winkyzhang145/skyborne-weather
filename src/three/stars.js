// 漂浮物：彩色泡泡 + 热气球 + 闪光星
import * as THREE from 'three'

export function createStars(scene) {
  const group = new THREE.Group()
  const items = []

  // 彩色泡泡（用透明球体）
  const bubbleColors = [0xFFB5D8, 0xB5E5FF, 0xC5F4D8, 0xFFE5B5, 0xE5C5FF, 0xFFD8B5]
  for (let i = 0; i < 30; i++) {
    const geo = new THREE.SphereGeometry(0.08 + Math.random() * 0.12, 16, 12)
    const mat = new THREE.MeshBasicMaterial({
      color: bubbleColors[i % bubbleColors.length],
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    })
    const bubble = new THREE.Mesh(geo, mat)
    const r = 5 + Math.random() * 6
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI * 0.5
    bubble.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      Math.random() * 4 - 1,
      r * Math.sin(phi) * Math.sin(theta)
    )
    bubble.userData = {
      speed: 0.2 + Math.random() * 0.3,
      basePos: bubble.position.y,
      offset: Math.random() * Math.PI * 2
    }
    group.add(bubble)
    items.push(bubble)
  }

  // 小型热气球
  for (let i = 0; i < 5; i++) {
    const balloon = createMiniBalloon(bubbleColors[i % bubbleColors.length])
    const r = 7 + Math.random() * 4
    const theta = Math.random() * Math.PI * 2
    balloon.position.set(
      r * Math.cos(theta),
      1 + Math.random() * 2,
      r * Math.sin(theta) - 3
    )
    balloon.userData = {
      speed: 0.1 + Math.random() * 0.15,
      baseY: balloon.position.y,
      offset: Math.random() * Math.PI * 2
    }
    group.add(balloon)
    items.push(balloon)
  }

  // 闪光小星点
  const starCount = 200
  const starGeo = new THREE.BufferGeometry()
  const starPos = new Float32Array(starCount * 3)
  const starCol = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    const r = 8 + Math.random() * 10
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 0.6 + 0.2)
    starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
    starPos[i * 3 + 1] = r * Math.cos(phi) + 1
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    const c = bubbleColors[i % bubbleColors.length]
    const col = new THREE.Color(c)
    starCol[i * 3]     = col.r
    starCol[i * 3 + 1] = col.g
    starCol[i * 3 + 2] = col.b
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3))
  const starMat = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })
  const stars = new THREE.Points(starGeo, starMat)
  group.add(stars)

  scene.add(group)
  return {
    update(t) {
      items.forEach(it => {
        const d = it.userData
        it.position.y = d.baseY + Math.sin(t * d.speed + d.offset) * 0.3
        it.rotation.y = t * 0.2 + d.offset
      })
    },
    group
  }
}

function createMiniBalloon(color) {
  const group = new THREE.Group()
  // 球冠
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6),
    new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.05 })
  )
  group.add(dome)
  // 底
  const basket = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.08, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.8 })
  )
  basket.position.y = -0.28
  group.add(basket)
  // 绳子
  const strings = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.06, -0.05, 0), new THREE.Vector3(-0.06, -0.24, 0),
      new THREE.Vector3(0.06, -0.05, 0), new THREE.Vector3(0.06, -0.24, 0),
      new THREE.Vector3(0, -0.05, -0.06), new THREE.Vector3(0, -0.24, -0.06),
      new THREE.Vector3(0, -0.05, 0.06), new THREE.Vector3(0, -0.24, 0.06)
    ]),
    new THREE.LineBasicMaterial({ color: 0x2D1B3D })
  )
  group.add(strings)
  return group
}
