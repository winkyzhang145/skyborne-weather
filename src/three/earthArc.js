// 远景：童话水晶山脉 + 草原
import * as THREE from 'three'

export function createEarthArc(scene) {
  const group = new THREE.Group()

  // 远景山脉 - 程序化生成多个圆锥
  const mountainColors = [0xFFB5D8, 0xC5A3FF, 0xB5E5FF, 0xFFD8B5, 0xC5F4D8]
  for (let i = 0; i < 12; i++) {
    const h = 1.8 + Math.random() * 2.5
    const w = 1.2 + Math.random() * 1.4
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(w, h, 6 + Math.floor(Math.random() * 4)),
      new THREE.MeshStandardMaterial({
        color: mountainColors[i % mountainColors.length],
        roughness: 0.7,
        metalness: 0.05,
        flatShading: true
      })
    )
    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.2
    const dist = 18 + Math.random() * 5
    cone.position.set(
      Math.cos(angle) * dist,
      h / 2 - 2.5,
      Math.sin(angle) * dist
    )
    cone.rotation.y = Math.random() * Math.PI
    group.add(cone)
  }

  // 远景草地 - 弧形带
  const grass = new THREE.Mesh(
    new THREE.CylinderGeometry(16, 18, 2, 64, 1, true, 0, Math.PI * 2),
    new THREE.MeshStandardMaterial({
      color: 0xC5F4D8,
      roughness: 0.9,
      side: THREE.DoubleSide
    })
  )
  grass.position.y = -2.5
  group.add(grass)

  // 草地顶部加一些小花（简化为小圆点）
  const flowerColors = [0xFFB5D8, 0xFFD23F, 0xFF6B9D, 0xC5A3FF]
  for (let i = 0; i < 60; i++) {
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 4),
      new THREE.MeshStandardMaterial({
        color: flowerColors[i % flowerColors.length],
        roughness: 0.6
      })
    )
    const angle = Math.random() * Math.PI * 2
    const dist = 4 + Math.random() * 11
    flower.position.set(
      Math.cos(angle) * dist,
      -1.3 + Math.random() * 0.2,
      Math.sin(angle) * dist - 2
    )
    group.add(flower)
  }

  // 太阳（在远景）
  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(2, 32),
    new THREE.MeshBasicMaterial({
      color: 0xFFD23F,
      transparent: true,
      opacity: 0.9
    })
  )
  sun.position.set(8, 8, -18)
  group.add(sun)

  // 太阳光芒
  const sunGlow = new THREE.Mesh(
    new THREE.CircleGeometry(3.5, 32),
    new THREE.MeshBasicMaterial({
      color: 0xFFE066,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  )
  sunGlow.position.copy(sun.position)
  sunGlow.position.z -= 0.1
  group.add(sunGlow)

  scene.add(group)

  return {
    update(t) {
      group.rotation.y = t * 0.015
      sunGlow.scale.setScalar(1 + Math.sin(t * 0.8) * 0.08)
    },
    group
  }
}
