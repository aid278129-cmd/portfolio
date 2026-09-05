/**
 * Scene — wires together all 3D elements.
 * - Strict 10 outfield defenders + 1 GK
 * - 4 chain (attacking) players
 * - Cinematic night floodlighting with SoftShadows
 * - BackSide net so ball is visible from inside
 */
import { Suspense, useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, SoftShadows } from '@react-three/drei'
import { BackSide, DoubleSide, CubeTextureLoader } from 'three'
import { Pitch }        from './Pitch.jsx'
import { Ball }         from './Ball.jsx'
import { CameraRig }    from './CameraRig.jsx'
import { HumanoidPlayer } from './HumanoidPlayer.jsx'
import { CrowdStands, StadiumSeats } from './CrowdStands.jsx'
import { DEFENDERS, PLAYER_CHAIN, GOALKEEPER } from '../data/sections.js'

// ── Scroll-to-animation-state mapper ────────────────────────────────────
function getChainState(entry, progress) {
  const range  = entry.tEnd - entry.tStart
  const localT = range > 0 ? (progress - entry.tStart) / range : 0
  if (entry.role === 'kick' && localT >= 0.75)  return 'shoot'
  if (localT >= 0.0  && localT < 0.20)          return 'pass'
  if (localT >= 0.20 && localT < 0.85)          return 'run'
  return 'idle'
}

// ── Procedural night skybox ───────────────────────────────────────────────
function drawSkyFace(ctx, W, H, face) {
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0.0, '#020408'); g.addColorStop(0.40, '#060c18')
  g.addColorStop(0.65, '#0a1428'); g.addColorStop(0.82, '#0f1e38')
  g.addColorStop(1.0, '#1a2d18')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)

  const seed = face * 73
  for (let i = 0; i < 250; i++) {
    const px = (Math.sin(i*137.5+seed)*0.5+0.5)*W
    const py = (Math.cos(i*97.3 +seed)*0.5+0.5)*H*0.62
    const r  = 0.32 + Math.sin(i*44.7)*0.28
    const br = 0.45 + Math.sin(i*23.1)*0.4
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2)
    ctx.fillStyle = `rgba(${Math.floor(200+br*55)},${Math.floor(200+br*55)},${Math.floor(220+br*35)},${br})`
    ctx.fill()
  }

  if (face < 4) {
    // Stadium roof silhouette
    ctx.fillStyle = '#040709'
    ctx.beginPath(); ctx.moveTo(0, H*0.77)
    for (let x = 0; x <= W; x += W/40) {
      ctx.lineTo(x, H*0.77 + Math.sin(x*0.12+face*3.7)*8 + Math.sin(x*0.05+face)*14)
    }
    ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill()

    // Floodlight glow halos
    const lc = 4
    const rimY = H * 0.71
    for (let l = 0; l < lc; l++) {
      const lx = (l+0.5)/lc*W
      const lg = ctx.createRadialGradient(lx,rimY,0, lx,rimY, W*0.09)
      lg.addColorStop(0,'rgba(255,255,200,0.58)'); lg.addColorStop(1,'rgba(255,240,100,0)')
      ctx.fillStyle=lg; ctx.beginPath(); ctx.arc(lx,rimY,W*0.09,0,Math.PI*2); ctx.fill()
    }
  }
}

function ProceduralSkybox() {
  const { scene } = useThree()
  useMemo(() => {
    const SIZE = 512
    const tex = new CubeTextureLoader().load(
      Array.from({length:6},(_,f)=>{
        const c=document.createElement('canvas'); c.width=c.height=SIZE
        drawSkyFace(c.getContext('2d'), SIZE, SIZE, f)
        return c.toDataURL()
      })
    )
    scene.background = tex
  }, [scene])
  return null
}

// ── Floodlight beam (volumetric cone) ────────────────────────────────────
function FloodBeam({ position: [x, y, z] }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.opacity = 0.032 + Math.sin(clock.getElapsedTime()*0.7)*0.007
  })
  return (
    <mesh ref={ref} position={[x, y*0.5, z]}>
      <coneGeometry args={[4.8, y, 8, 1, true]} />
      <meshBasicMaterial color="#fffde0" transparent opacity={0.032} depthWrite={false} side={BackSide} />
    </mesh>
  )
}

// ── Scene lights ─────────────────────────────────────────────────────────
function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.07} color="#0d1828" />
      <hemisphereLight skyColor="#0a1830" groundColor="#0c1e08" intensity={0.22} />

      {/* Four corner floodlight spots — high intensity, cast shadows */}
      {[[-16,24,-52],[16,24,-52],[-16,24,52],[16,24,52]].map(([x,y,z],i) => (
        <spotLight key={i}
          position={[x,y,z]} intensity={850} angle={0.58} penumbra={0.28}
          color="#fff8e8" castShadow shadow-mapSize={[1024,1024]} shadow-bias={-0.0008}
        />
      ))}

      {/* Cool side fills for depth separation */}
      <pointLight position={[-22,8,0]}  intensity={55} color="#162e6a" distance={80} decay={2} />
      <pointLight position={[ 22,8,0]}  intensity={55} color="#162e6a" distance={80} decay={2} />

      {/* Goal area warm accent so net reads */}
      <pointLight position={[0,7,-49]} intensity={110} color="#fff0c0" distance={24} decay={2} />
      <pointLight position={[0,7, 49]} intensity={80}  color="#fff0c0" distance={24} decay={2} />

      {/* Centre pitch highlight */}
      <pointLight position={[0,18,0]}  intensity={220} color="#fffae8" distance={58} decay={2} />
    </>
  )
}

// ── Floodlight tower structures ──────────────────────────────────────────
function FloodlightTowers() {
  const positions = [[-16,0,-52],[16,0,-52],[-16,0,52],[16,0,52]]
  return (
    <group>
      {positions.map(([x,y,z],i) => (
        <group key={i} position={[x,y,z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.18,0.26,26,8]} />
            <meshStandardMaterial color="#282828" roughness={0.5} metalness={0.7} />
          </mesh>
          <mesh position={[0,13.2,1.0]}>
            <boxGeometry args={[3.8,0.28,0.20]} />
            <meshStandardMaterial color="#333" roughness={0.5} metalness={0.6} />
          </mesh>
          <mesh position={[0,13.5,1.1]}>
            <boxGeometry args={[3.5,0.46,0.66]} />
            <meshStandardMaterial color="#fffde0" emissive="#fffaaa" emissiveIntensity={4.2} roughness={0.1} />
          </mesh>
          <mesh position={[0,13.5,1.1]}>
            <boxGeometry args={[3.9,0.72,0.88]} />
            <meshBasicMaterial color="#fffde0" transparent opacity={0.11} depthWrite={false} />
          </mesh>
        </group>
      ))}
      {positions.map(([x,y,z],i) => <FloodBeam key={i} position={[x,y+1,z]} />)}
    </group>
  )
}

// ── Goal with net (BackSide + wireframe for mesh look) ───────────────────
function GoalPost({ side }) {
  const s = side === 'top' ? 1 : -1
  const z = s * 50
  const ry = side === 'top' ? Math.PI : 0

  return (
    <group position={[0, 0, z]} rotation={[0, ry, 0]}>
      {/* Posts */}
      {[[-3.66], [3.66]].map(([x],i) => (
        <mesh key={i} position={[x, 1.22, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 2.44, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.8} />
        </mesh>
      ))}
      {/* Crossbar */}
      <mesh position={[0, 2.44, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 7.32, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.8} />
      </mesh>

      {/* Net back wall — BackSide so ball is visible from inside */}
      <mesh position={[0, 1.22, -1.6]}>
        <planeGeometry args={[7.32, 2.44, 24, 16]} />
        <meshStandardMaterial color="#d8d8d8" transparent opacity={0.20}
          side={BackSide} depthWrite={false} />
      </mesh>
      {/* Net wireframe overlay (mesh look) — DoubleSide so visible entering */}
      <mesh position={[0, 1.22, -1.6]}>
        <planeGeometry args={[7.32, 2.44, 24, 16]} />
        <meshBasicMaterial color="#dddddd" transparent opacity={0.44}
          wireframe depthWrite={false} side={DoubleSide} />
      </mesh>
      {/* Floor net */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, -0.95]}>
        <planeGeometry args={[7.32, 1.9, 14, 4]} />
        <meshBasicMaterial color="#bbbbbb" transparent opacity={0.34} wireframe />
      </mesh>
      {/* Side nets */}
      {[[-3.66, Math.PI/2],[3.66, -Math.PI/2]].map(([x, ry2],i) => (
        <mesh key={i} position={[x, 1.22, -0.95]} rotation={[0, ry2, 0]}>
          <planeGeometry args={[1.9, 2.44, 4, 10]} />
          <meshBasicMaterial color="#cccccc" transparent opacity={0.34} wireframe />
        </mesh>
      ))}
    </group>
  )
}

// ── Main Scene ────────────────────────────────────────────────────────────
export function Scene({ progress, isZoomed, isGoal, activeDefenders, onGoal }) {
  return (
    <Canvas
      shadows
      dpr={[1, Math.min(window.devicePixelRatio, 1.5)]}
      camera={{ fov: 60, near: 0.1, far: 320, position: [0, 10, 65] }}
      style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:1 }}
      gl={{ antialias: true, alpha: false, toneMappingExposure: 1.18 }}
    >
      <SoftShadows size={24} samples={14} focus={0.5} />
      <fogExp2 attach="fog" args={['#040810', 0.006]} />

      <Suspense fallback={null}>
        <ProceduralSkybox />
        <SceneLights />
        <Stars radius={145} depth={70} count={4000} factor={4} saturation={0.12} fade speed={0.22} />

        <Pitch />
        <StadiumSeats />
        <CrowdStands />
        <FloodlightTowers />
        <GoalPost side="bottom" />
        <GoalPost side="top" />

        {/* ── Attacking chain (our players, blue kits) ── */}
        {PLAYER_CHAIN.map(entry => (
          <HumanoidPlayer
            key={entry.id}
            position={[entry.position.x, 0, entry.position.z]}
            label={entry.label}
            state={getChainState(entry, progress)}
            kitColor="#1a4fa8"
            kitAccent="#ffffff"
            shortColor="#0d1a3a"
            skinTone={entry.skinTone}
            hairColor={entry.hairColor}
            facingAngle={Math.PI}
            showGlow={true}
            glowColor="#4488ff"
          />
        ))}

        {/* ── 10 outfield defenders — strict count from data ── */}
        {DEFENDERS.map(d => (
          <HumanoidPlayer
            key={d.id}
            position={[d.pos.x, 0, d.pos.z]}
            label={d.label}
            state={activeDefenders.includes('foundation') && d.id.startsWith('d1') ? 'defend'
                 : activeDefenders.includes('logic')      && d.id.startsWith('d5') ? 'defend'
                 : activeDefenders.includes('innovation') && d.id.startsWith('d8') ? 'defend'
                 : 'idle'}
            kitColor={d.kit}
            kitAccent="#ffff00"
            shortColor="#110011"
            skinTone={d.skin}
            hairColor={d.hair}
            facingAngle={0}
            showGlow={false}
          />
        ))}

        {/* ── 1 Goalkeeper ── */}
        <HumanoidPlayer
          position={[GOALKEEPER.position.x, 0, GOALKEEPER.position.z]}
          label="GK"
          state={progress > 0.85 ? 'defend' : 'idle'}
          kitColor="#ff8800"
          kitAccent="#111111"
          shortColor="#111111"
          skinTone={GOALKEEPER.skinTone}
          hairColor={GOALKEEPER.hairColor}
          isGoalkeeper={true}
          facingAngle={Math.PI}
          showGlow={progress > 0.85}
          glowColor="#ff8800"
        />

        <Ball progress={progress} onGoal={onGoal} />
        <CameraRig progress={progress} isZoomed={isZoomed} isGoal={isGoal} />
      </Suspense>
    </Canvas>
  )
}
