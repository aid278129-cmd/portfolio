import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping } from 'three'

function createGrassTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#1a4410'
  ctx.fillRect(0, 0, size, size)
  // Mow pattern — alternating dark/light stripes
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1a4410' : '#1e5012'
    ctx.fillRect(0, i * (size / 16), size, size / 16)
  }
  // Grass blade noise
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * size, y = Math.random() * size
    const len = 3 + Math.random() * 7
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6
    ctx.beginPath(); ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len)
    const g = Math.floor(80 + Math.random() * 55)
    ctx.strokeStyle = `rgb(${Math.floor(g*0.28)},${g},${Math.floor(g*0.18)})`
    ctx.lineWidth = 0.6 + Math.random() * 0.7; ctx.stroke()
  }
  return new CanvasTexture(canvas)
}

function createGrassNormal() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#8080ff'; ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * size, y = Math.random() * size
    const v = Math.floor(90 + Math.random() * 100)
    ctx.fillStyle = `rgb(${v},${Math.floor(v*0.55)},255)`
    ctx.fillRect(x, y, 2, 2)
  }
  return new CanvasTexture(canvas)
}

export function Pitch() {
  const grassTex  = useMemo(() => {
    const t = createGrassTexture()
    t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(8, 24); return t
  }, [])
  const normalTex = useMemo(() => {
    const t = createGrassNormal()
    t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(8, 24); return t
  }, [])

  return (
    <group>
      {/* Main pitch surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[34, 100, 32, 64]} />
        <meshStandardMaterial
          map={grassTex}
          normalMap={normalTex}
          normalScale={[0.55, 0.55]}
          roughness={0.95}
          metalness={0}
          color="#2a6020"
        />
      </mesh>

      {/* Mow stripes */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -45 + i * 10]} receiveShadow>
          <planeGeometry args={[34, 10]} />
          <meshStandardMaterial
            map={grassTex}
            roughness={0.95}
            color={i % 2 === 0 ? '#2a6020' : '#306822'}
            transparent opacity={0.6}
          />
        </mesh>
      ))}

      {/* Pitch perimeter runoff — dark grass outside lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
        <planeGeometry args={[80, 130]} />
        <meshStandardMaterial color="#122808" roughness={1} />
      </mesh>

      {/* ── WHITE MARKINGS ── */}
      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[4.85, 5.18, 52]} />
        <meshStandardMaterial color="#ffffff" roughness={0.75} />
      </mesh>
      {/* Center spot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.28, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.75} />
      </mesh>
      {/* Halfway line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <planeGeometry args={[34, 0.11]} />
        <meshStandardMaterial color="#ffffff" roughness={0.75} />
      </mesh>
      {/* Sidelines */}
      {[[-17], [17]].map(([x], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.012, 0]}>
          <planeGeometry args={[0.11, 100]} />
          <meshStandardMaterial color="#ffffff" roughness={0.75} />
        </mesh>
      ))}
      {/* Goal lines */}
      {[[-50], [50]].map(([z], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, z]}>
          <planeGeometry args={[34, 0.11]} />
          <meshStandardMaterial color="#ffffff" roughness={0.75} />
        </mesh>
      ))}
      {/* Penalty areas */}
      {[[-38], [38]].map(([z], i) => (
        <group key={i}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, z]}>
            <planeGeometry args={[20, 0.11]} />
            <meshStandardMaterial color="#ffffff" roughness={0.75} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-10, 0.012, z + (i===0 ? 6 : -6)]}>
            <planeGeometry args={[0.11, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.75} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.012, z + (i===0 ? 6 : -6)]}>
            <planeGeometry args={[0.11, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.75} />
          </mesh>
          {/* Penalty spot */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, z + (i===0 ? 9 : -9)]}>
            <circleGeometry args={[0.22, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.75} />
          </mesh>
          {/* Goal box */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, z + (i===0 ? 3 : -3)]}>
            <planeGeometry args={[8, 0.11]} />
            <meshStandardMaterial color="#ffffff" roughness={0.75} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4, 0.012, z + (i===0 ? 4.5 : -4.5)]}>
            <planeGeometry args={[0.11, 5.5]} />
            <meshStandardMaterial color="#ffffff" roughness={0.75} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0.012, z + (i===0 ? 4.5 : -4.5)]}>
            <planeGeometry args={[0.11, 5.5]} />
            <meshStandardMaterial color="#ffffff" roughness={0.75} />
          </mesh>
        </group>
      ))}
      {/* Corner arcs */}
      {[[-17, -50], [17, -50], [-17, 50], [17, 50]].map(([x, z], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.013, z]}>
          <ringGeometry args={[0.95, 1.1, 12, 1, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.75} />
        </mesh>
      ))}

      {/* Goalposts */}
      <GoalPostOnly position={[0, 0,  50]} rotateY={Math.PI} />
      <GoalPostOnly position={[0, 0, -50]} rotateY={0} />

      {/* Stadium concrete apron / track */}
      {[[-17.5, 0, 0], [17.5, 0, 0]].map(([x, y, z], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.01, z]}>
          <planeGeometry args={[2.0, 104]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function GoalPostOnly({ position, rotateY = 0 }) {
  return (
    <group position={position} rotation={[0, rotateY, 0]}>
      <mesh position={[-3.66, 1.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.075, 0.075, 2.44, 12]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.15} metalness={0.85} />
      </mesh>
      <mesh position={[3.66, 1.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.075, 0.075, 2.44, 12]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.15} metalness={0.85} />
      </mesh>
      <mesh position={[0, 2.44, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.075, 0.075, 7.32, 12]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.15} metalness={0.85} />
      </mesh>
      {/* Post reflections (subtle emission) */}
      <mesh position={[-3.66, 1.22, 0]}>
        <cylinderGeometry args={[0.082, 0.082, 2.44, 12]} />
        <meshBasicMaterial color="#ffffee" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh position={[3.66, 1.22, 0]}>
        <cylinderGeometry args={[0.082, 0.082, 2.44, 12]} />
        <meshBasicMaterial color="#ffffee" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  )
}
