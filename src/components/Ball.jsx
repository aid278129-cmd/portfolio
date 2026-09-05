/**
 * Ball — GSAP-quality scroll lerp + Bezier passes + parabolic final shot.
 * 
 * Physics:
 *  - Dribble: sinusoidal side-to-side + vertical bounce while tethered to player
 *  - Pass:    Quadratic Bezier arc (height ∝ pass distance)
 *  - Shot:    Steeper Bezier with hard rightward bend to top-right corner
 *  - Rotation: velocity-driven, both axes respond to direction
 *  - Contact shadow: scales/fades with altitude
 *  - Goal fires ONLY after ball.z crosses deep inside net
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, CanvasTexture } from 'three'
import { PLAYER_CHAIN, GOAL_NET_TARGET, GOAL_LINE_Z } from '../data/sections.js'

// ── Texture ────────────────────────────────────────────────────────────────
function createSoccerBallTexture() {
  const S = 512
  const c = document.createElement('canvas')
  c.width = c.height = S
  const ctx = c.getContext('2d')

  // White base
  ctx.fillStyle = '#efefef'
  ctx.fillRect(0, 0, S, S)

  // Patches: 1 pentagon centre + 8 hexagons
  const patches = [
    [S/2,      S/2,      5, 62],
    [S/2,      S*0.17,   6, 54],
    [S/2,      S*0.83,   6, 54],
    [S*0.19,   S*0.33,   6, 54],
    [S*0.81,   S*0.33,   6, 54],
    [S*0.19,   S*0.67,   6, 54],
    [S*0.81,   S*0.67,   6, 54],
    [S*0.09,   S*0.50,   6, 50],
    [S*0.91,   S*0.50,   6, 50],
  ]
  patches.forEach(([cx, cy, sides, r]) => {
    ctx.beginPath()
    for (let s = 0; s < sides; s++) {
      const a = (s / sides) * Math.PI * 2 - Math.PI / 2
      s === 0 ? ctx.moveTo(cx + r*Math.cos(a), cy + r*Math.sin(a))
              : ctx.lineTo(cx + r*Math.cos(a), cy + r*Math.sin(a))
    }
    ctx.closePath()
    ctx.fillStyle = '#101010'; ctx.fill()
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3.5; ctx.stroke()
  })

  // Leather grain
  for (let i = 0; i < 280; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.055})`
    ctx.fillRect(Math.random()*S, Math.random()*S, 2, 2)
  }

  // Specular
  const g = ctx.createRadialGradient(S*.30, S*.26, 0, S*.30, S*.26, S*.30)
  g.addColorStop(0,   'rgba(255,255,255,0.40)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.12)')
  g.addColorStop(1,   'rgba(255,255,255,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S)

  return new CanvasTexture(c)
}

// ── Math helpers ───────────────────────────────────────────────────────────
function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t }
function easeOut3(t)  { return 1-(1-t)**3 }

// GSAP-style frame-rate-independent lerp
function gsapLerp(cur, target, strength, dt) {
  const alpha = 1 - Math.pow(1 - strength, dt * 60)
  return cur + (target - cur) * alpha
}

function quadBezier(p0, p1, p2, t, out) {
  const mt = 1 - t
  out.set(
    mt*mt*p0.x + 2*mt*t*p1.x + t*t*p2.x,
    mt*mt*p0.y + 2*mt*t*p1.y + t*t*p2.y,
    mt*mt*p0.z + 2*mt*t*p1.z + t*t*p2.z,
  )
}

const BALL_Y = 0.42

// Build a pass arc between two chain-player positions
function buildArc(fromPlayer, toPlayer) {
  const from = fromPlayer.position.clone().add(new Vector3(0, BALL_Y, -0.65))
  const to   = toPlayer.position.clone().add(new Vector3(0, BALL_Y,  0.45))
  const dist = from.distanceTo(to)
  const ctrl = new Vector3(
    (from.x + to.x) / 2,
    BALL_Y + dist * 0.24,   // arc height proportional to pass distance
    (from.z + to.z) / 2,
  )
  return { from, ctrl, to }
}

// ── Component ──────────────────────────────────────────────────────────────
export function Ball({ progress, onGoal }) {
  const meshRef    = useRef()
  const shadowRef  = useRef()
  const shadowRingRef = useRef()
  const prevPos    = useRef(null)
  const smoothP    = useRef(0)
  const vel        = useRef(new Vector3())
  const goalFired  = useRef(false)

  const texture  = useMemo(() => createSoccerBallTexture(), [])

  // Pre-build all pass arcs once
  const passArcs = useMemo(() => {
    const arcs = []
    for (let i = 1; i < PLAYER_CHAIN.length; i++) {
      arcs.push(buildArc(PLAYER_CHAIN[i-1], PLAYER_CHAIN[i]))
    }
    return arcs
  }, [])

  // Final shot: shooter → top-right corner deep in net
  const shooter   = PLAYER_CHAIN.find(p => p.role === 'kick')
  const shotStart = shooter ? shooter.tEnd : 0.88
  const shotP0    = shooter
    ? shooter.position.clone().add(new Vector3(0, BALL_Y, -0.9))
    : new Vector3(0, BALL_Y, -26)
  const shotP2    = GOAL_NET_TARGET.clone()
  const shotP1    = new Vector3(
    (shotP0.x + shotP2.x) / 2 + 5.0,   // rightward curve away from keeper
    8.2,                                  // tall arc — peaks above crossbar
    (shotP0.z + shotP2.z) / 2 - 1.5,
  )

  useFrame(({ clock }, rawDelta) => {
    if (!meshRef.current) return
    const dt = Math.min(rawDelta, 0.05)
    const elapsed = clock.getElapsedTime()

    // GSAP-quality scroll lerp — cinematic glide, never snap
    smoothP.current = gsapLerp(smoothP.current, progress, 0.08, dt)
    const t = Math.max(0, Math.min(1, smoothP.current))

    const pos = new Vector3()

    if (t < shotStart) {
      // ── Find which player currently has possession ──────────────
      let entry = PLAYER_CHAIN[0], index = 0
      for (let i = PLAYER_CHAIN.length - 1; i >= 0; i--) {
        if (t >= PLAYER_CHAIN[i].tStart) { entry = PLAYER_CHAIN[i]; index = i; break }
      }

      const range  = entry.tEnd - entry.tStart
      const localT = range > 0 ? (t - entry.tStart) / range : 0

      // First 22% of each segment = in-flight Bezier pass arc
      if (localT < 0.22 && index > 0) {
        const arc  = passArcs[index - 1]
        const arcT = easeInOut(localT / 0.22)
        quadBezier(arc.from, arc.ctrl, arc.to, arcT, pos)
      } else {
        // Tethered dribble: sinusoidal side-to-side + vertical bounce
        const base = entry.position
        const dribFreq = 5.8
        const dribAmp  = 0.38
        pos.set(
          base.x + Math.sin(elapsed * dribFreq) * dribAmp,
          BALL_Y + Math.abs(Math.sin(elapsed * 9.0)) * 0.14,
          base.z + Math.abs(Math.cos(elapsed * 2.6)) * 0.28 - 0.7,
        )
      }

      // Reset goal flag when scrolled back
      if (t < 0.75) goalFired.current = false

    } else {
      // ── Final shot: parabolic Bezier into top-right corner ──────
      const rawShotT = Math.max(0, Math.min(1, (t - shotStart) / (1.0 - shotStart)))
      const shotT    = easeOut3(rawShotT)
      quadBezier(shotP0, shotP1, shotP2, shotT, pos)

      // Fire GOAL only when ball is genuinely past the goal line
      if (!goalFired.current && pos.z <= GOAL_LINE_Z + 0.5) {
        goalFired.current = true
        onGoal?.()
      }
    }

    meshRef.current.position.copy(pos)

    // ── Velocity-driven rotation ─────────────────────────────────
    if (prevPos.current) {
      vel.current.subVectors(pos, prevPos.current).divideScalar(Math.max(dt, 0.001))
      const spd = vel.current.length()
      if (spd > 0.002) {
        const rm = Math.min(spd * 5.5, 14)
        meshRef.current.rotation.x += vel.current.z * rm * dt * 60
        meshRef.current.rotation.z -= vel.current.x * rm * dt * 60
      }
    }
    prevPos.current = pos.clone()

    // ── Contact shadow: shrinks & fades as ball rises ────────────
    if (shadowRef.current && shadowRingRef.current) {
      const h     = Math.max(0, pos.y - BALL_Y)
      const scale = Math.max(0.12, 1 - h * 0.11)
      const alpha = Math.max(0.03, 0.36 - h * 0.055)
      shadowRef.current.scale.setScalar(scale)
      shadowRef.current.position.set(pos.x, 0.013, pos.z)
      shadowRef.current.material.opacity = alpha
      shadowRingRef.current.scale.setScalar(scale * 1.38)
      shadowRingRef.current.position.set(pos.x, 0.012, pos.z)
      shadowRingRef.current.material.opacity = alpha * 0.38
    }
  })

  return (
    <>
      {/* Contact shadow — blob */}
      <mesh ref={shadowRef} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.013, 43]}>
        <circleGeometry args={[0.48, 28]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.36} depthWrite={false} />
      </mesh>
      {/* Contact shadow — soft penumbra ring */}
      <mesh ref={shadowRingRef} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.012, 43]}>
        <ringGeometry args={[0.42, 0.82, 28]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.13} depthWrite={false} />
      </mesh>

      {/* Ball */}
      <group ref={meshRef} position={[0, BALL_Y, 43]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.42, 56, 56]} />
          <meshStandardMaterial map={texture} roughness={0.33} metalness={0.04} />
        </mesh>
        {/* Night rim glow */}
        <mesh>
          <sphereGeometry args={[0.435, 16, 16]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.04}
            emissive="#ffffff" emissiveIntensity={0.14} depthWrite={false} />
        </mesh>
      </group>
    </>
  )
}
