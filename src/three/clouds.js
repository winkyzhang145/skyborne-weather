// 蓬松棉花糖云朵
import * as THREE from 'three'

function makeCloudTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  // 多层叠加制造蓬松感
  for (let i = 0; i < 6; i++) {
    const x = size * 0.3 + Math.random() * size * 0.4
    const y = size * 0.3 + Math.random() * size * 0.4
    const r = 30 + Math.random() * 50
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, 'rgba(255,255,255,0.9)')
    grad.addColorStop(0.5, 'rgba(255,255,255,0.5)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function createClouds(scene) {
  const group = new THREE.Group()
  const clouds = []
  const cloudCount = 18

  const tex = makeCloudTexture()

  // 棉花糖调色板
  const palette = [0xFFFFFF, 0xFFE5EC, 0xE8D5F2, 0xD5F2E8, 0xFFE5D5, 0xD5E5F2]

  for (let i = 0; i < cloudCount; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      color: palette[i % palette.length],
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
    const sprite = new THREE.Sprite(mat)
    const scale = 2.5 + Math.random() * 4
    sprite.scale.set(scale, scale * 0.5, 1)
    sprite.position.set(
      (Math.random() - 0.5) * 18,
      Math.random() * 4 - 0.5,
      (Math.random() - 0.5) * 8 - 3
    )
    sprite.userData = {
      speed: 0.05 + Math.random() * 0.08,
      bob: Math.random() * Math.PI * 2
    }
    group.add(sprite)
    clouds.push(sprite)
  }

  scene.add(group)

  let targetOpacity = 0

  return {
    group,
    update(t) {
      clouds.forEach(s => {
        const d = s.userData
        s.position.x += d.speed * 0.01
        s.position.y += Math.sin(t * 0.4 + d.bob) * 0.001
        if (s.position.x > 10) s.position.x = -10
        s.material.opacity += (targetOpacity - s.material.opacity) * 0.04
      })
    },
    setState(s) {
      if (s === 'cloudy') targetOpacity = 0.85
      else if (s === 'rainy') targetOpacity = 0.75
      else if (s === 'snowy') targetOpacity = 0.7
      else if (s === 'foggy') targetOpacity = 0.55
      else if (s === 'partly') targetOpacity = 0.4
      else targetOpacity = 0.25
    }
  }
}
