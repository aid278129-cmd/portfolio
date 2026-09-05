import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { CubeTextureLoader, CanvasTexture, PMREMGenerator, WebGLCubeRenderTarget, CubeCamera } from 'three'

/**
 * NightSkybox — procedural stadium night sky environment.
 * Draws 6 faces of a cube map with:
 * - Deep indigo night sky with stars
 * - Stadium upper tier rim lighting
 * - Dramatic volumetric-style light cone hints
 * - City glow on horizon
 */

function drawSkyFace(ctx, W, H, face) {
  // Night sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H)
  skyGrad.addColorStop(0.0, '#020408')
  skyGrad.addColorStop(0.35, '#060c18')
  skyGrad.addColorStop(0.65, '#0a1428')
  skyGrad.addColorStop(0.80, '#0f1e38')
  skyGrad.addColorStop(1.0, '#1a2d18')
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, W, H)

  // Stars — vary by face
  const seed = face * 73
  for (let i = 0; i < 200; i++) {
    const px = (Math.sin(i * 137.5 + seed) * 0.5 + 0.5) * W
    const py = (Math.cos(i * 97.3 + seed) * 0.5 + 0.5) * H * 0.6
    const r = 0.4 + Math.sin(i * 44.7) * 0.35
    const bright = 0.4 + Math.sin(i * 23.1) * 0.4
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${Math.floor(200 + bright * 55)}, ${Math.floor(200 + bright * 55)}, ${Math.floor(220 + bright * 35)}, ${bright})`
    ctx.fill()
  }

  // Milky way band (subtle)
  for (let i = 0; i < 80; i++) {
    const px = ((i / 80) * 1.4 - 0.2) * W
    const py = H * (0.15 + Math.sin(i * 0.18) * 0.15)
    const r = 1.5 + Math.sin(i * 33.7) * 1.0
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(180, 200, 240, ${0.03 + Math.sin(i * 17.3) * 0.02})`
    ctx.fill()
  }

  // Stadium upper rim (bright floodlights strip at horizon)
  if (face !== 2 && face !== 3) { // not top/bottom
    const rimY = H * 0.72
    const rimGrad = ctx.createLinearGradient(0, rimY - 12, 0, rimY + 8)
    rimGrad.addColorStop(0, 'rgba(255,250,200,0.0)')
    rimGrad.addColorStop(0.4, 'rgba(255,248,180,0.35)')
    rimGrad.addColorStop(0.7, 'rgba(255,245,150,0.25)')
    rimGrad.addColorStop(1, 'rgba(255,240,100,0.0)')
    ctx.fillStyle = rimGrad
    ctx.fillRect(0, rimY - 12, W, 20)

    // Individual floodlight blobs
    const lights = face === 0 ? 4 : face === 1 ? 4 : 3
    for (let l = 0; l < lights; l++) {
      const lx = (l + 0.5) / lights * W
      const ly = H * 0.72
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, W * 0.12)
      lg.addColorStop(0, 'rgba(255,255,220,0.55)')
      lg.addColorStop(0.3, 'rgba(255,245,180,0.18)')
      lg.addColorStop(1, 'rgba(255,240,100,0)')
      ctx.fillStyle = lg
      ctx.beginPath()
      ctx.arc(lx, ly, W * 0.12, 0, Math.PI * 2)
      ctx.fill()

      // Light beam cone pointing down (subtle)
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(lx, ly)
      ctx.lineTo(lx - W * 0.04, H * 0.98)
      ctx.lineTo(lx + W * 0.04, H * 0.98)
      ctx.closePath()
      const coneGrad = ctx.createLinearGradient(lx, ly, lx, H * 0.98)
      coneGrad.addColorStop(0, 'rgba(255,250,200,0.10)')
      coneGrad.addColorStop(1, 'rgba(255,250,200,0)')
      ctx.fillStyle = coneGrad
      ctx.fill()
      ctx.restore()
    }

    // Stadium roof silhouette
    const roofY = H * 0.78
    ctx.fillStyle = '#070a12'
    ctx.beginPath()
    ctx.moveTo(0, roofY)
    for (let x = 0; x <= W; x += W / 40) {
      const noise = Math.sin(x * 0.12 + face * 3.7) * 8 + Math.sin(x * 0.05 + face) * 14
      ctx.lineTo(x, roofY + noise)
    }
    ctx.lineTo(W, H)
    ctx.lineTo(0, H)
    ctx.closePath()
    ctx.fill()

    // City glow below stadium
    const cityGrad = ctx.createLinearGradient(0, H * 0.85, 0, H)
    cityGrad.addColorStop(0, 'rgba(40, 80, 20, 0.0)')
    cityGrad.addColorStop(0.5, 'rgba(30, 60, 15, 0.4)')
    cityGrad.addColorStop(1, 'rgba(20, 40, 10, 0.6)')
    ctx.fillStyle = cityGrad
    ctx.fillRect(0, H * 0.85, W, H * 0.15)
  }

  // Top face — pure dark sky
  if (face === 2) {
    const topGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.7)
    topGrad.addColorStop(0, '#080e20')
    topGrad.addColorStop(1, '#020408')
    ctx.fillStyle = topGrad
    ctx.fillRect(0, 0, W, H)
    // Extra stars on top face
    for (let i = 0; i < 400; i++) {
      const px = ((i * 73.13) % 1) * W
      const py = ((i * 47.31) % 1) * H
      const r  = 0.3 + Math.sin(i * 19.7) * 0.3
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(220, 230, 255, ${0.3 + Math.sin(i * 43.1) * 0.3})`
      ctx.fill()
    }
  }
}

export function NightSkybox() {
  const { gl } = useThree()

  useMemo(() => {
    const SIZE = 512
    const faces = []
    for (let f = 0; f < 6; f++) {
      const canvas = document.createElement('canvas')
      canvas.width = SIZE
      canvas.height = SIZE
      const ctx = canvas.getContext('2d')
      drawSkyFace(ctx, SIZE, SIZE, f)
      faces.push(canvas)
    }

    // Load as CubeTexture
    const loader = new CubeTextureLoader()
    // We'll use Scene's background assignment instead — return data URLs
    const urls = faces.map(c => c.toDataURL())

    // Store for Scene to use
    window.__nightSkyFaces = urls
  }, [])

  return null
}

/**
 * ProceduralSkybox — sets the scene background directly
 */
export function ProceduralSkybox() {
  const { scene, gl } = useThree()

  useMemo(() => {
    const SIZE = 1024
    const canvases = []

    for (let f = 0; f < 6; f++) {
      const c = document.createElement('canvas')
      c.width = SIZE; c.height = SIZE
      const ctx = c.getContext('2d')
      drawSkyFace(ctx, SIZE, SIZE, f)
      canvases.push(c)
    }

    const loader = new CubeTextureLoader()
    const tex = loader.load(canvases.map(c => c.toDataURL()))
    scene.background = tex
    scene.environment = tex
  }, [scene])

  return null
}
