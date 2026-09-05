import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { MathUtils, Vector3, Quaternion } from 'three'

/**
 * HumanoidPlayer — high-fidelity articulated humanoid.
 * Far more anatomically correct than the cylinder/box primitive version.
 * 
 * States: 'idle' | 'run' | 'dribble' | 'pass' | 'shoot' | 'defend' | 'celebrate'
 * 
 * Features:
 * - Articulated spine, shoulders, hips, knees, ankles
 * - LookAt: rotates head/torso to track ball position
 * - Multiple skin tone variants
 * - Realistic kit with collar, number, shorts seam
 * - High-quality contact shadow
 */
export function HumanoidPlayer({
  position,
  label,
  state = 'idle',
  kitColor = '#1a4fa8',
  kitAccent = '#ffffff',
  shortColor = '#0d1a3a',
  skinTone = 0,          // 0-4 index
  hairColor = 0,         // 0-3 index
  isGoalkeeper = false,
  facingAngle = Math.PI,
  ballPosition = null,   // Vector3 — for LookAt
  showLabel = true,
  showGlow = false,
  glowColor = '#4488ff',
}) {
  const rootRef    = useRef()
  const hipRef     = useRef()
  const spineRef   = useRef()
  const chestRef   = useRef()
  const headRef    = useRef()
  const neckRef    = useRef()
  const shoulderLRef = useRef()
  const shoulderRRef = useRef()
  const upperArmLRef = useRef()
  const upperArmRRef = useRef()
  const foreArmLRef  = useRef()
  const foreArmRRef  = useRef()
  const upperLegLRef = useRef()
  const upperLegRRef = useRef()
  const lowerLegLRef = useRef()
  const lowerLegRRef = useRef()
  const footLRef     = useRef()
  const footRRef     = useRef()
  const kickT        = useRef(0)
  const runCycle     = useRef(0)
  const lookQ        = useRef(new Quaternion())

  const SKIN_TONES = ['#f5c99a', '#e8a87c', '#c8834a', '#9b5d30', '#6b3520']
  const HAIR_COLORS = ['#1a0a04', '#3d2011', '#8b5a2b', '#f0c060']
  const skin = SKIN_TONES[Math.min(skinTone, 4)]
  const hair = HAIR_COLORS[Math.min(hairColor, 3)]
  const shoe = '#111111'
  const sock = isGoalkeeper ? '#ffdd00' : '#ffffff'
  const GK_KIT = '#ff6600'
  const actualKit = isGoalkeeper ? GK_KIT : kitColor
  const actualAccent = isGoalkeeper ? '#222222' : kitAccent

  useFrame(({ clock }) => {
    if (!rootRef.current) return
    const t = clock.getElapsedTime()

    // ── Breathing bob — always ────────────────────────────────────────────
    rootRef.current.position.y = position[1] + Math.sin(t * 1.6) * 0.04

    // ── LookAt ball — head and spine track ball position ─────────────────
    if (ballPosition && headRef.current) {
      const bp = ballPosition
      const myPos = new Vector3(position[0], position[1] + 1.7, position[2])
      const dir = new Vector3(bp.x - myPos.x, bp.y - myPos.y, bp.z - myPos.z).normalize()
      const dist = myPos.distanceTo(bp)
      const clampedY = MathUtils.clamp(Math.atan2(dir.x, dir.z), -0.9, 0.9)
      const clampedX = MathUtils.clamp(Math.atan2(-dir.y, Math.sqrt(dir.x**2 + dir.z**2)) * 0.4, -0.5, 0.3)
      if (dist < 22) {
        headRef.current.rotation.y = MathUtils.lerp(headRef.current.rotation.y, clampedY, 0.08)
        headRef.current.rotation.x = MathUtils.lerp(headRef.current.rotation.x, clampedX, 0.06)
        if (spineRef.current && dist < 12) {
          spineRef.current.rotation.y = MathUtils.lerp(spineRef.current.rotation.y, clampedY * 0.3, 0.05)
        }
      }
    }

    if (state === 'shoot') {
      // ── SHOOT: windup → contact → follow-through ─────────────────────
      kickT.current = Math.min(kickT.current + 0.035, 1)
      const kp = kickT.current

      const kickAngle = kp < 0.35
        ? MathUtils.lerp(0, -1.5, kp / 0.35)
        : MathUtils.lerp(-1.5, 2.0, (kp - 0.35) / 0.65)

      if (upperLegRRef.current) upperLegRRef.current.rotation.x = kickAngle
      if (lowerLegRRef.current) {
        lowerLegRRef.current.rotation.x = kp < 0.35
          ? MathUtils.lerp(0, 1.0, kp / 0.35)
          : MathUtils.lerp(1.0, -0.3, (kp - 0.35) / 0.65)
      }
      if (footRRef.current) footRRef.current.rotation.x = kp < 0.35 ? -0.4 : 0.2
      if (upperLegLRef.current) upperLegLRef.current.rotation.x = MathUtils.lerp(upperLegLRef.current.rotation.x, -0.2, 0.12)
      if (spineRef.current) {
        spineRef.current.rotation.x = MathUtils.lerp(spineRef.current.rotation.x, kp > 0.35 ? 0.35 : 0.05, 0.1)
        spineRef.current.rotation.z = MathUtils.lerp(spineRef.current.rotation.z, kp > 0.35 ? -0.15 : 0, 0.08)
      }
      if (upperArmLRef.current) upperArmLRef.current.rotation.z = MathUtils.lerp(upperArmLRef.current.rotation.z, -1.1, 0.1)
      if (upperArmRRef.current) upperArmRRef.current.rotation.z = MathUtils.lerp(upperArmRRef.current.rotation.z,  0.6, 0.1)
      if (upperArmLRef.current) upperArmLRef.current.rotation.x = MathUtils.lerp(upperArmLRef.current.rotation.x, -0.5, 0.1)
      if (upperArmRRef.current) upperArmRRef.current.rotation.x = MathUtils.lerp(upperArmRRef.current.rotation.x,  0.3, 0.1)

    } else if (state === 'pass') {
      // ── PASS: lean forward, push through ─────────────────────────────
      kickT.current = 0
      if (spineRef.current) spineRef.current.rotation.x = MathUtils.lerp(spineRef.current.rotation.x, 0.25, 0.07)
      if (upperArmLRef.current) {
        upperArmLRef.current.rotation.x = MathUtils.lerp(upperArmLRef.current.rotation.x, -0.7, 0.09)
        upperArmLRef.current.rotation.z = MathUtils.lerp(upperArmLRef.current.rotation.z, -0.35, 0.09)
      }
      if (foreArmLRef.current) foreArmLRef.current.rotation.x = MathUtils.lerp(foreArmLRef.current.rotation.x, 0.6, 0.09)
      if (upperLegRRef.current) upperLegRRef.current.rotation.x = MathUtils.lerp(upperLegRRef.current.rotation.x, -0.5, 0.1)
      if (lowerLegRRef.current) lowerLegRRef.current.rotation.x = MathUtils.lerp(lowerLegRRef.current.rotation.x, 0.4, 0.1)

    } else if (state === 'run' || state === 'dribble') {
      // ── RUN/DRIBBLE: proper running gait ─────────────────────────────
      kickT.current = 0
      runCycle.current += state === 'dribble' ? 0.025 : 0.022
      const rc = runCycle.current
      const speed = state === 'dribble' ? 4.5 : 3.8

      if (spineRef.current) spineRef.current.rotation.x = MathUtils.lerp(spineRef.current.rotation.x, 0.12, 0.07)
      if (hipRef.current) hipRef.current.rotation.z = Math.sin(rc * speed) * 0.07
      if (spineRef.current) spineRef.current.rotation.z = -Math.sin(rc * speed) * 0.06

      const runAmpl = state === 'dribble' ? 0.7 : 0.85
      if (upperLegLRef.current) upperLegLRef.current.rotation.x =  Math.sin(rc * speed) * runAmpl
      if (upperLegRRef.current) upperLegRRef.current.rotation.x = -Math.sin(rc * speed) * runAmpl
      if (lowerLegLRef.current) {
        const knee = Math.max(0, -Math.sin(rc * speed)) * runAmpl * 1.2
        lowerLegLRef.current.rotation.x = knee
      }
      if (lowerLegRRef.current) {
        const knee = Math.max(0,  Math.sin(rc * speed)) * runAmpl * 1.2
        lowerLegRRef.current.rotation.x = knee
      }
      if (footLRef.current) footLRef.current.rotation.x = Math.sin(rc * speed) * 0.15
      if (footRRef.current) footRRef.current.rotation.x = -Math.sin(rc * speed) * 0.15

      // Arm swing — opposite to legs
      if (upperArmLRef.current) {
        upperArmLRef.current.rotation.x = -Math.sin(rc * speed) * 0.55
        upperArmLRef.current.rotation.z = MathUtils.lerp(upperArmLRef.current.rotation.z, 0.12, 0.06)
      }
      if (upperArmRRef.current) {
        upperArmRRef.current.rotation.x =  Math.sin(rc * speed) * 0.55
        upperArmRRef.current.rotation.z = MathUtils.lerp(upperArmRRef.current.rotation.z, -0.12, 0.06)
      }
      if (foreArmLRef.current) foreArmLRef.current.rotation.x = Math.max(0, Math.sin(rc * speed)) * 0.5
      if (foreArmRRef.current) foreArmRRef.current.rotation.x = Math.max(0, -Math.sin(rc * speed)) * 0.5

    } else if (state === 'defend') {
      // ── DEFEND: wide stance, arms spread, weight shift ────────────────
      kickT.current = 0
      if (hipRef.current) hipRef.current.rotation.z = Math.sin(t * 1.8) * 0.08
      if (spineRef.current) {
        spineRef.current.rotation.x = MathUtils.lerp(spineRef.current.rotation.x, 0.18, 0.06)
        spineRef.current.rotation.z = MathUtils.lerp(spineRef.current.rotation.z, Math.sin(t * 1.5) * 0.07, 0.06)
      }
      if (upperArmLRef.current) {
        upperArmLRef.current.rotation.z = MathUtils.lerp(upperArmLRef.current.rotation.z,  0.9, 0.07)
        upperArmLRef.current.rotation.x = MathUtils.lerp(upperArmLRef.current.rotation.x, -0.2, 0.07)
      }
      if (upperArmRRef.current) {
        upperArmRRef.current.rotation.z = MathUtils.lerp(upperArmRRef.current.rotation.z, -0.9, 0.07)
        upperArmRRef.current.rotation.x = MathUtils.lerp(upperArmRRef.current.rotation.x, -0.2, 0.07)
      }
      if (upperLegLRef.current) upperLegLRef.current.rotation.x = MathUtils.lerp(upperLegLRef.current.rotation.x, 0.15, 0.06)
      if (upperLegRRef.current) upperLegRRef.current.rotation.x = MathUtils.lerp(upperLegRRef.current.rotation.x, -0.15, 0.06)

    } else if (state === 'celebrate') {
      // ── CELEBRATE: arms pump, jump ────────────────────────────────────
      kickT.current = 0
      const cel = Math.sin(t * 4.5)
      rootRef.current.position.y = position[1] + Math.abs(Math.sin(t * 4.5)) * 0.4
      if (upperArmLRef.current) {
        upperArmLRef.current.rotation.x = cel * 0.7 - 1.2
        upperArmLRef.current.rotation.z = MathUtils.lerp(upperArmLRef.current.rotation.z, -1.3, 0.1)
      }
      if (upperArmRRef.current) {
        upperArmRRef.current.rotation.x = -cel * 0.7 - 1.2
        upperArmRRef.current.rotation.z = MathUtils.lerp(upperArmRRef.current.rotation.z,  1.3, 0.1)
      }
      if (foreArmLRef.current) foreArmLRef.current.rotation.x = MathUtils.lerp(foreArmLRef.current.rotation.x, -1.2, 0.1)
      if (foreArmRRef.current) foreArmRRef.current.rotation.x = MathUtils.lerp(foreArmRRef.current.rotation.x, -1.2, 0.1)
      if (spineRef.current) spineRef.current.rotation.x = MathUtils.lerp(spineRef.current.rotation.x, -0.15, 0.08)

    } else {
      // ── IDLE: breathing, subtle sway ──────────────────────────────────
      kickT.current = 0
      if (spineRef.current) {
        spineRef.current.rotation.x = MathUtils.lerp(spineRef.current.rotation.x, 0, 0.04)
        spineRef.current.rotation.z = Math.sin(t * 0.85) * 0.028
      }
      if (upperArmLRef.current) {
        upperArmLRef.current.rotation.z = MathUtils.lerp(upperArmLRef.current.rotation.z, Math.sin(t * 1.05) * 0.09 + 0.1, 0.04)
        upperArmLRef.current.rotation.x = MathUtils.lerp(upperArmLRef.current.rotation.x, 0, 0.04)
      }
      if (upperArmRRef.current) {
        upperArmRRef.current.rotation.z = MathUtils.lerp(upperArmRRef.current.rotation.z, -Math.sin(t * 1.05) * 0.09 - 0.1, 0.04)
        upperArmRRef.current.rotation.x = MathUtils.lerp(upperArmRRef.current.rotation.x, 0, 0.04)
      }
      if (foreArmLRef.current) foreArmLRef.current.rotation.x = MathUtils.lerp(foreArmLRef.current.rotation.x, 0, 0.04)
      if (foreArmRRef.current) foreArmRRef.current.rotation.x = MathUtils.lerp(foreArmRRef.current.rotation.x, 0, 0.04)
      if (upperLegLRef.current) upperLegLRef.current.rotation.x = MathUtils.lerp(upperLegLRef.current.rotation.x, 0, 0.04)
      if (upperLegRRef.current) upperLegRRef.current.rotation.x = MathUtils.lerp(upperLegRRef.current.rotation.x, 0, 0.04)
      if (lowerLegLRef.current) lowerLegLRef.current.rotation.x = MathUtils.lerp(lowerLegLRef.current.rotation.x, 0, 0.04)
      if (lowerLegRRef.current) lowerLegRRef.current.rotation.x = MathUtils.lerp(lowerLegRRef.current.rotation.x, 0, 0.04)
    }
  })

  // ── Geometry constants ────────────────────────────────────────────────────
  // All positioned relative to root origin (feet at y=0)
  const H = {
    footH: 0.10, footL: 0.32, footW: 0.16,
    ankleY: 0.12,
    lowerLegH: 0.40, lowerLegR: 0.085,
    kneeY: 0.52,
    upperLegH: 0.44, upperLegR: 0.115,
    hipY: 0.96,
    pelvisH: 0.22, pelvisW: 0.44,
    spineH: 0.30,
    chestH: 0.40, chestW: 0.56, chestD: 0.30,
    shoulderY: 1.55, shoulderSpread: 0.36,
    upperArmH: 0.34, upperArmR: 0.075,
    elbowOffset: 0.18,
    foreArmH: 0.30, foreArmR: 0.065,
    handR: 0.068,
    neckH: 0.18, neckR: 0.08,
    headR: 0.22,
    headY: 1.98,
    legSpread: 0.17,
  }

  return (
    <group ref={rootRef} position={position} rotation={[0, facingAngle, 0]} frustumCulled={false}>

      {/* ── HIGH-QUALITY CONTACT SHADOW ─────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      {/* Soft outer penumbra */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.010, 0]}>
        <ringGeometry args={[0.4, 0.8, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.18} depthWrite={false} />
      </mesh>

      {/* ── FEET / BOOTS ────────────────────────────────────────────────── */}
      <group ref={footLRef} position={[-H.legSpread, H.ankleY, 0.04]}>
        {/* Boot main */}
        <mesh position={[0, 0, 0.06]} castShadow>
          <boxGeometry args={[H.footW, H.footH, H.footL]} />
          <meshStandardMaterial color={shoe} roughness={0.35} metalness={0.1} />
        </mesh>
        {/* Boot sole */}
        <mesh position={[0, -0.06, 0.06]}>
          <boxGeometry args={[H.footW + 0.02, 0.04, H.footL + 0.02]} />
          <meshStandardMaterial color="#333333" roughness={0.9} />
        </mesh>
        {/* Lace tongue */}
        <mesh position={[0, 0.055, 0.12]}>
          <boxGeometry args={[0.08, 0.03, 0.1]} />
          <meshStandardMaterial color="#cccccc" roughness={0.9} />
        </mesh>
      </group>
      <group ref={footRRef} position={[H.legSpread, H.ankleY, 0.04]}>
        <mesh position={[0, 0, 0.06]} castShadow>
          <boxGeometry args={[H.footW, H.footH, H.footL]} />
          <meshStandardMaterial color={shoe} roughness={0.35} metalness={0.1} />
        </mesh>
        <mesh position={[0, -0.06, 0.06]}>
          <boxGeometry args={[H.footW + 0.02, 0.04, H.footL + 0.02]} />
          <meshStandardMaterial color="#333333" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.055, 0.12]}>
          <boxGeometry args={[0.08, 0.03, 0.1]} />
          <meshStandardMaterial color="#cccccc" roughness={0.9} />
        </mesh>
      </group>

      {/* ── SOCKS ─────────────────────────────────────────────────────────── */}
      <mesh position={[-H.legSpread, H.ankleY + 0.22, 0]} castShadow>
        <cylinderGeometry args={[H.lowerLegR - 0.005, H.lowerLegR - 0.005, 0.42, 10]} />
        <meshStandardMaterial color={sock} roughness={0.85} />
      </mesh>
      <mesh position={[H.legSpread, H.ankleY + 0.22, 0]} castShadow>
        <cylinderGeometry args={[H.lowerLegR - 0.005, H.lowerLegR - 0.005, 0.42, 10]} />
        <meshStandardMaterial color={sock} roughness={0.85} />
      </mesh>
      {/* Sock band */}
      <mesh position={[-H.legSpread, H.ankleY + 0.44, 0]}>
        <cylinderGeometry args={[H.lowerLegR + 0.005, H.lowerLegR + 0.005, 0.05, 10]} />
        <meshStandardMaterial color={actualKit} roughness={0.75} />
      </mesh>
      <mesh position={[H.legSpread, H.ankleY + 0.44, 0]}>
        <cylinderGeometry args={[H.lowerLegR + 0.005, H.lowerLegR + 0.005, 0.05, 10]} />
        <meshStandardMaterial color={actualKit} roughness={0.75} />
      </mesh>
      {/* Shin guards under socks */}
      <mesh position={[-H.legSpread, H.ankleY + 0.28, 0.07]}>
        <boxGeometry args={[0.09, 0.26, 0.04]} />
        <meshStandardMaterial color="#dddddd" roughness={0.6} />
      </mesh>
      <mesh position={[H.legSpread, H.ankleY + 0.28, 0.07]}>
        <boxGeometry args={[0.09, 0.26, 0.04]} />
        <meshStandardMaterial color="#dddddd" roughness={0.6} />
      </mesh>

      {/* ── LOWER LEGS ────────────────────────────────────────────────────── */}
      <group ref={lowerLegLRef} position={[-H.legSpread, H.kneeY, 0]}>
        <mesh position={[0, -H.lowerLegH/2, 0]} castShadow>
          <cylinderGeometry args={[H.lowerLegR * 0.88, H.lowerLegR, H.lowerLegH, 10]} />
          <meshStandardMaterial color={skin} roughness={0.82} />
        </mesh>
        {/* Knee cap */}
        <mesh position={[0, 0, 0.075]}>
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshStandardMaterial color={skin} roughness={0.75} />
        </mesh>
      </group>
      <group ref={lowerLegRRef} position={[H.legSpread, H.kneeY, 0]}>
        <mesh position={[0, -H.lowerLegH/2, 0]} castShadow>
          <cylinderGeometry args={[H.lowerLegR * 0.88, H.lowerLegR, H.lowerLegH, 10]} />
          <meshStandardMaterial color={skin} roughness={0.82} />
        </mesh>
        <mesh position={[0, 0, 0.075]}>
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshStandardMaterial color={skin} roughness={0.75} />
        </mesh>
      </group>

      {/* ── SHORTS ────────────────────────────────────────────────────────── */}
      {/* Loose shorts drape around upper thigh */}
      <mesh position={[-H.legSpread, H.kneeY + 0.06, 0]} castShadow>
        <cylinderGeometry args={[H.upperLegR + 0.02, H.upperLegR + 0.015, 0.10, 10]} />
        <meshStandardMaterial color={shortColor} roughness={0.8} />
      </mesh>
      <mesh position={[H.legSpread, H.kneeY + 0.06, 0]} castShadow>
        <cylinderGeometry args={[H.upperLegR + 0.02, H.upperLegR + 0.015, 0.10, 10]} />
        <meshStandardMaterial color={shortColor} roughness={0.8} />
      </mesh>

      {/* ── UPPER LEGS ────────────────────────────────────────────────────── */}
      <group ref={upperLegLRef} position={[-H.legSpread, H.hipY, 0]}>
        <mesh position={[0, -H.upperLegH/2, 0]} castShadow>
          <cylinderGeometry args={[H.upperLegR * 0.9, H.upperLegR, H.upperLegH, 10]} />
          <meshStandardMaterial color={skin} roughness={0.80} />
        </mesh>
      </group>
      <group ref={upperLegRRef} position={[H.legSpread, H.hipY, 0]}>
        <mesh position={[0, -H.upperLegH/2, 0]} castShadow>
          <cylinderGeometry args={[H.upperLegR * 0.9, H.upperLegR, H.upperLegH, 10]} />
          <meshStandardMaterial color={skin} roughness={0.80} />
        </mesh>
      </group>

      {/* ── PELVIS / HIP BLOCK ────────────────────────────────────────────── */}
      <group ref={hipRef} position={[0, H.hipY + 0.06, 0]}>
        {/* Shorts main body */}
        <mesh castShadow>
          <boxGeometry args={[H.pelvisW, H.pelvisH, H.chestD * 0.9]} />
          <meshStandardMaterial color={shortColor} roughness={0.8} />
        </mesh>
        {/* Shorts waistband */}
        <mesh position={[0, H.pelvisH/2 + 0.01, 0]}>
          <boxGeometry args={[H.pelvisW + 0.01, 0.05, H.chestD * 0.9 + 0.01]} />
          <meshStandardMaterial color={actualKit} roughness={0.7} />
        </mesh>

        {/* ── SPINE ──────────────────────────────────────────────────────── */}
        <group ref={spineRef} position={[0, H.pelvisH/2 + 0.01, 0]}>

          {/* ── CHEST / TORSO KIT ──────────────────────────────────────── */}
          <group ref={chestRef} position={[0, H.spineH + H.chestH/2, 0]}>
            <mesh castShadow>
              <boxGeometry args={[H.chestW, H.chestH, H.chestD]} />
              <meshStandardMaterial color={actualKit} roughness={0.65} metalness={0.05} />
            </mesh>

            {/* Kit front chest panel — slight color accent */}
            <mesh position={[0, 0.04, H.chestD/2 + 0.002]}>
              <planeGeometry args={[H.chestW * 0.55, H.chestH * 0.75]} />
              <meshStandardMaterial color={actualKit} roughness={0.60} />
            </mesh>

            {/* Collar */}
            <mesh position={[0, H.chestH/2 - 0.02, H.chestD/2 - 0.01]}>
              <boxGeometry args={[0.18, 0.10, 0.04]} />
              <meshStandardMaterial color={actualAccent} roughness={0.75} />
            </mesh>

            {/* Sponsor / Number plate */}
            <mesh position={[0, 0.04, H.chestD/2 + 0.005]}>
              <planeGeometry args={[0.22, 0.22]} />
              <meshStandardMaterial color={actualAccent} transparent opacity={0.75} roughness={0.8} />
            </mesh>

            {/* Kit shoulder stripes */}
            <mesh position={[-H.chestW/2 + 0.02, H.chestH * 0.2, H.chestD/2 + 0.002]}>
              <planeGeometry args={[0.06, H.chestH * 0.55]} />
              <meshStandardMaterial color={actualAccent} transparent opacity={0.6} />
            </mesh>
            <mesh position={[H.chestW/2 - 0.02, H.chestH * 0.2, H.chestD/2 + 0.002]}>
              <planeGeometry args={[0.06, H.chestH * 0.55]} />
              <meshStandardMaterial color={actualAccent} transparent opacity={0.6} />
            </mesh>

            {/* ── SHOULDERS ────────────────────────────────────────────── */}
            <group ref={shoulderLRef} position={[-(H.chestW/2 + 0.03), H.chestH * 0.3, 0]}>
              {/* Shoulder cap */}
              <mesh castShadow>
                <sphereGeometry args={[0.10, 10, 10]} />
                <meshStandardMaterial color={actualKit} roughness={0.65} />
              </mesh>

              {/* ── UPPER ARM ──────────────────────────────────────────── */}
              <group ref={upperArmLRef} position={[-0.02, 0, 0]}>
                <mesh position={[0, -H.upperArmH/2, 0]} rotation={[0, 0, 0.1]} castShadow>
                  <cylinderGeometry args={[H.upperArmR * 0.88, H.upperArmR, H.upperArmH, 9]} />
                  <meshStandardMaterial color={actualKit} roughness={0.65} />
                </mesh>
                {/* Elbow */}
                <mesh position={[0, -H.upperArmH - 0.02, 0]}>
                  <sphereGeometry args={[0.072, 9, 9]} />
                  <meshStandardMaterial color={skin} roughness={0.80} />
                </mesh>
                {/* Forearm */}
                <group ref={foreArmLRef} position={[0, -H.upperArmH - 0.04, 0]}>
                  <mesh position={[0, -H.foreArmH/2, 0]} castShadow>
                    <cylinderGeometry args={[H.foreArmR * 0.85, H.foreArmR, H.foreArmH, 9]} />
                    <meshStandardMaterial color={skin} roughness={0.80} />
                  </mesh>
                  {/* Hand */}
                  <mesh position={[0, -H.foreArmH - 0.03, 0]} castShadow>
                    <sphereGeometry args={[H.handR, 9, 9]} />
                    <meshStandardMaterial color={skin} roughness={0.75} />
                  </mesh>
                </group>
              </group>
            </group>

            {/* Right shoulder mirror */}
            <group ref={shoulderRRef} position={[(H.chestW/2 + 0.03), H.chestH * 0.3, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.10, 10, 10]} />
                <meshStandardMaterial color={actualKit} roughness={0.65} />
              </mesh>
              <group ref={upperArmRRef} position={[0.02, 0, 0]}>
                <mesh position={[0, -H.upperArmH/2, 0]} rotation={[0, 0, -0.1]} castShadow>
                  <cylinderGeometry args={[H.upperArmR * 0.88, H.upperArmR, H.upperArmH, 9]} />
                  <meshStandardMaterial color={actualKit} roughness={0.65} />
                </mesh>
                <mesh position={[0, -H.upperArmH - 0.02, 0]}>
                  <sphereGeometry args={[0.072, 9, 9]} />
                  <meshStandardMaterial color={skin} roughness={0.80} />
                </mesh>
                <group ref={foreArmRRef} position={[0, -H.upperArmH - 0.04, 0]}>
                  <mesh position={[0, -H.foreArmH/2, 0]} castShadow>
                    <cylinderGeometry args={[H.foreArmR * 0.85, H.foreArmR, H.foreArmH, 9]} />
                    <meshStandardMaterial color={skin} roughness={0.80} />
                  </mesh>
                  <mesh position={[0, -H.foreArmH - 0.03, 0]} castShadow>
                    <sphereGeometry args={[H.handR, 9, 9]} />
                    <meshStandardMaterial color={skin} roughness={0.75} />
                  </mesh>
                </group>
              </group>
            </group>

            {/* ── NECK ───────────────────────────────────────────────────── */}
            <mesh position={[0, H.chestH/2 + H.neckH/2, 0]} castShadow>
              <cylinderGeometry args={[H.neckR * 1.05, H.neckR, H.neckH, 10]} />
              <meshStandardMaterial color={skin} roughness={0.80} />
            </mesh>

            {/* ── HEAD ───────────────────────────────────────────────────── */}
            <group ref={headRef} position={[0, H.chestH/2 + H.neckH + H.headR * 0.9, 0]}>
              {/* Main skull */}
              <mesh castShadow>
                <sphereGeometry args={[H.headR, 24, 18]} />
                <meshStandardMaterial color={skin} roughness={0.80} />
              </mesh>
              {/* Jaw widening */}
              <mesh position={[0, -0.06, 0.04]} scale={[1.0, 0.55, 1.0]}>
                <sphereGeometry args={[H.headR * 0.85, 16, 12]} />
                <meshStandardMaterial color={skin} roughness={0.82} />
              </mesh>
              {/* Hair / cap */}
              <mesh position={[0, 0.09, -0.02]} scale={[1.0, 0.55, 1.0]}>
                <sphereGeometry args={[H.headR + 0.01, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                <meshStandardMaterial color={hair} roughness={0.95} />
              </mesh>
              {/* Ear L */}
              <mesh position={[-H.headR * 0.96, 0, 0.02]}>
                <sphereGeometry args={[0.038, 8, 8]} />
                <meshStandardMaterial color={skin} roughness={0.85} />
              </mesh>
              {/* Ear R */}
              <mesh position={[H.headR * 0.96, 0, 0.02]}>
                <sphereGeometry args={[0.038, 8, 8]} />
                <meshStandardMaterial color={skin} roughness={0.85} />
              </mesh>
              {/* Eyes */}
              <mesh position={[-0.085, 0.020, H.headR * 0.92]}>
                <sphereGeometry args={[0.032, 9, 9]} />
                <meshStandardMaterial color="#f8f8f8" roughness={0.2} />
              </mesh>
              <mesh position={[-0.085, 0.020, H.headR * 0.97]}>
                <sphereGeometry args={[0.020, 9, 9]} />
                <meshStandardMaterial color="#111111" />
              </mesh>
              <mesh position={[0.085, 0.020, H.headR * 0.92]}>
                <sphereGeometry args={[0.032, 9, 9]} />
                <meshStandardMaterial color="#f8f8f8" roughness={0.2} />
              </mesh>
              <mesh position={[0.085, 0.020, H.headR * 0.97]}>
                <sphereGeometry args={[0.020, 9, 9]} />
                <meshStandardMaterial color="#111111" />
              </mesh>
              {/* Mouth line */}
              <mesh position={[0, -0.065, H.headR * 0.96]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.055, 0.010, 0.005]} />
                <meshStandardMaterial color="#8b4040" roughness={0.9} />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      {/* ── LABEL ──────────────────────────────────────────────────────────── */}
      {showLabel && (
        <Text
          position={[0, 2.72, 0]}
          fontSize={0.25}
          color="#f0d060"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.032}
          outlineColor="#000000"
          frustumCulled={false}
        >
          {label}
        </Text>
      )}

      {/* ── GLOW RING ──────────────────────────────────────────────────────── */}
      {showGlow && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <ringGeometry args={[0.55, 0.80, 36]} />
            <meshBasicMaterial color={glowColor} transparent opacity={0.50} depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.80, 1.20, 36]} />
            <meshBasicMaterial color={glowColor} transparent opacity={0.18} depthWrite={false} />
          </mesh>
        </>
      )}
    </group>
  )
}
