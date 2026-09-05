import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  InstancedMesh, Object3D, MeshBasicMaterial,
  PlaneGeometry, Color, CanvasTexture, RepeatWrapping, Vector3
} from 'three'
import { useThree } from '@react-three/fiber'

/**
 * CrowdStands — high-performance crowd using instanced 2D sprite cards.
 * Each "card" is a billboard quad with a baked silhouette texture.
 * This approach renders thousands of spectators in a single draw call.
 */
function createCrowdAtlas() {
  const W = 512, H = 256
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Transparent background
  ctx.clearRect(0, 0, W, H)

  // Draw 8 crowd silhouette sprites in a 4×2 grid
  const cols = 4, rows = 2
  const sw = W / cols, sh = H / rows

  const kitColors = [
    '#cc2222', '#2244cc', '#22cc44', '#ffcc22',
    '#cc44cc', '#22cccc', '#ff6622', '#ffffff'
  ]

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const ox = c * sw, oy = r * sh
      const kitCol = kitColors[i % kitColors.length]

      // Body
      ctx.fillStyle = kitCol
      const bx = ox + sw * 0.25, by = oy + sh * 0.35
      const bw = sw * 0.50, bh = sh * 0.48
      ctx.beginPath()
      ctx.roundRect(bx, by, bw, bh, [6, 6, 2, 2])
      ctx.fill()

      // Arms raised (excited fan)
      ctx.fillStyle = kitCol
      if (i % 3 === 0) {
        // Arms up
        ctx.beginPath()
        ctx.ellipse(ox + sw * 0.14, oy + sh * 0.26, sw * 0.07, sh * 0.25, -0.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(ox + sw * 0.86, oy + sh * 0.26, sw * 0.07, sh * 0.25, 0.5, 0, Math.PI * 2)
        ctx.fill()
      } else if (i % 3 === 1) {
        // Arms at sides
        ctx.beginPath()
        ctx.ellipse(ox + sw * 0.16, oy + sh * 0.50, sw * 0.07, sh * 0.22, 0.3, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(ox + sw * 0.84, oy + sh * 0.50, sw * 0.07, sh * 0.22, -0.3, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // One arm up
        ctx.beginPath()
        ctx.ellipse(ox + sw * 0.13, oy + sh * 0.22, sw * 0.06, sh * 0.28, -0.3, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(ox + sw * 0.84, oy + sh * 0.50, sw * 0.06, sh * 0.20, -0.2, 0, Math.PI * 2)
        ctx.fill()
      }

      // Head
      ctx.fillStyle = ['#f5c99a', '#c8834a', '#9b5d30', '#e8a87c'][i % 4]
      ctx.beginPath()
      ctx.ellipse(ox + sw * 0.50, oy + sh * 0.24, sw * 0.14, sh * 0.20, 0, 0, Math.PI * 2)
      ctx.fill()

      // Hair
      ctx.fillStyle = ['#1a0a04', '#3d2011', '#f0c060', '#111111'][i % 4]
      ctx.beginPath()
      ctx.ellipse(ox + sw * 0.50, oy + sh * 0.16, sw * 0.14, sh * 0.13, 0, 0, Math.PI * 2)
      ctx.fill()

      // Scarf or banner sometimes
      if (i % 2 === 0) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(ox + sw * 0.22, oy + sh * 0.56, sw * 0.56, sh * 0.08)
      }
    }
  }

  const tex = new CanvasTexture(canvas)
  return tex
}

export function CrowdStands() {
  const meshRef = useRef()
  const atlas = useMemo(() => createCrowdAtlas(), [])

  // Generate positions for all crowd seats
  const positions = useMemo(() => {
    const pts = []
    // Long sides (east & west stands)
    for (let z = -52; z <= 52; z += 1.4) {
      for (let row = 0; row < 7; row++) {
        const rowOffset = row * 1.2
        const riseY = row * 1.05
        pts.push({
          pos: new Vector3(-19.5 - rowOffset, 0.5 + riseY, z),
          variant: Math.floor(Math.abs(z * 3 + row * 7)) % 8,
          scale: 1.05 + Math.random() * 0.15,
          facing: Math.PI / 2, // face inward
        })
        pts.push({
          pos: new Vector3(19.5 + rowOffset, 0.5 + riseY, z),
          variant: Math.floor(Math.abs(z * 5 + row * 3)) % 8,
          scale: 1.05 + Math.random() * 0.15,
          facing: -Math.PI / 2,
        })
      }
    }
    // End stands (north & south)
    for (let x = -16; x <= 16; x += 1.4) {
      for (let row = 0; row < 5; row++) {
        const rowOffset = row * 1.2
        const riseY = row * 1.1
        pts.push({
          pos: new Vector3(x, 0.5 + riseY, 54 + rowOffset),
          variant: Math.floor(Math.abs(x * 3 + row * 11)) % 8,
          scale: 1.0 + Math.random() * 0.12,
          facing: Math.PI,
        })
        pts.push({
          pos: new Vector3(x, 0.5 + riseY, -54 - rowOffset),
          variant: Math.floor(Math.abs(x * 7 + row * 5)) % 8,
          scale: 1.0 + Math.random() * 0.12,
          facing: 0,
        })
      }
    }
    return pts
  }, [])

  // Build instanced mesh manually for performance
  const { scene } = useThree()
  const dummy = useMemo(() => new Object3D(), [])

  // Use a single merged mesh approach via ref
  useFrame(({ camera }) => {
    if (!meshRef.current) return
    // Billboard: rotate each instance to face camera on Y axis
    positions.forEach((p, i) => {
      dummy.position.copy(p.pos)
      const dx = camera.position.x - p.pos.x
      const dz = camera.position.z - p.pos.z
      dummy.rotation.y = Math.atan2(dx, dz)
      dummy.scale.setScalar(p.scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      // Set UV offset based on variant (8 sprites in 4x2 grid)
      // Handled via material for simplicity — use vertex color as variant flag
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, positions.length]} castShadow>
      <planeGeometry args={[1.1, 2.0]} />
      <meshBasicMaterial
        map={atlas}
        transparent
        alphaTest={0.05}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

/**
 * StadiumSeats — colored seat planes behind the crowd for visual mass
 */
export function StadiumSeats() {
  return (
    <group>
      {/* West stand colored seats background */}
      <mesh position={[-28, 4.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[110, 10]} />
        <meshStandardMaterial color="#1a1a2e" roughness={1} emissive="#0a0a18" emissiveIntensity={0.3} />
      </mesh>
      {/* East stand */}
      <mesh position={[28, 4.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[110, 10]} />
        <meshStandardMaterial color="#1a1a2e" roughness={1} emissive="#0a0a18" emissiveIntensity={0.3} />
      </mesh>
      {/* North end */}
      <mesh position={[0, 3.0, 60]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[38, 7]} />
        <meshStandardMaterial color="#1a1a2e" roughness={1} emissive="#0a0a18" emissiveIntensity={0.3} />
      </mesh>
      {/* South end */}
      <mesh position={[0, 3.0, -60]} rotation={[0, 0, 0]}>
        <planeGeometry args={[38, 7]} />
        <meshStandardMaterial color="#1a1a2e" roughness={1} emissive="#0a0a18" emissiveIntensity={0.3} />
      </mesh>

      {/* Stadium tier walls */}
      {[[-32, 5, 0, Math.PI/2], [32, 5, 0, -Math.PI/2]].map(([x, y, z, ry], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, ry, 0]}>
          <planeGeometry args={[112, 12]} />
          <meshStandardMaterial color="#111122" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}
