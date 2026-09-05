import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { MathUtils } from 'three'

/**
 * PlayerDefender — low-poly humanoid with:
 * - Idle breathing + head bob
 * - "Active" defensive stance (arms out, weight shift)
 * - "Kicking" animation (leg swings through) triggered by isKicking prop
 * - Contact shadow directly beneath feet
 */
export function PlayerDefender({
  position,
  label,
  isActive    = false,
  isKicking   = false,
  color       = '#c0392b',
  facingAngle = 0,        // Y rotation so player faces field center / goal
}) {
  const groupRef    = useRef()
  const bodyRef     = useRef()
  const headRef     = useRef()
  const armLRef     = useRef()
  const armRRef     = useRef()
  const legLRef     = useRef()
  const legRRef     = useRef()
  const kickPhase   = useRef(0)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()

    // Whole-body breathing bob
    groupRef.current.position.y = position.y + Math.sin(t * 1.4) * 0.04

    // Subtle head sway
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.65) * 0.22
      headRef.current.rotation.x = Math.sin(t * 0.45) * 0.04
    }

    if (isKicking) {
      // Advance kick phase
      kickPhase.current = Math.min(kickPhase.current + 0.055, 1)
      const kp = kickPhase.current

      // Right leg swings back then forward
      const kickAngle = kp < 0.4
        ? MathUtils.lerp(0, -1.1, kp / 0.4)           // wind-up
        : MathUtils.lerp(-1.1, 1.4, (kp - 0.4) / 0.6) // follow-through

      if (legRRef.current) legRRef.current.rotation.x = kickAngle
      // Left leg plants and braces
      if (legLRef.current) legLRef.current.rotation.x = MathUtils.lerp(legLRef.current.rotation.x, -0.2, 0.12)
      // Body leans forward during follow-through
      if (bodyRef.current) bodyRef.current.rotation.x = MathUtils.lerp(bodyRef.current.rotation.x, kp > 0.4 ? 0.35 : 0, 0.12)
      // Arms balance
      if (armLRef.current) armLRef.current.rotation.z = MathUtils.lerp(armLRef.current.rotation.z, -0.9, 0.1)
      if (armRRef.current) armRRef.current.rotation.z = MathUtils.lerp(armRRef.current.rotation.z,  0.4, 0.1)

    } else {
      // Reset kick phase when not kicking
      kickPhase.current = 0

      if (isActive) {
        // Defensive ready — arms wide, slight crouch
        if (bodyRef.current)  bodyRef.current.rotation.z  = MathUtils.lerp(bodyRef.current.rotation.z,  Math.sin(t * 1.5) * 0.08, 0.1)
        if (bodyRef.current)  bodyRef.current.rotation.x  = MathUtils.lerp(bodyRef.current.rotation.x,  0.15, 0.06)
        if (armLRef.current)  armLRef.current.rotation.z  = MathUtils.lerp(armLRef.current.rotation.z,   0.80, 0.08)
        if (armRRef.current)  armRRef.current.rotation.z  = MathUtils.lerp(armRRef.current.rotation.z,  -0.80, 0.08)
        if (legLRef.current)  legLRef.current.rotation.x  = MathUtils.lerp(legLRef.current.rotation.x,   0.14, 0.06)
        if (legRRef.current)  legRRef.current.rotation.x  = MathUtils.lerp(legRRef.current.rotation.x,  -0.14, 0.06)
      } else {
        // Idle arm swing
        if (armLRef.current)  armLRef.current.rotation.z  = MathUtils.lerp(armLRef.current.rotation.z,  Math.sin(t * 1.2) * 0.12 + 0.08, 0.05)
        if (armRRef.current)  armRRef.current.rotation.z  = MathUtils.lerp(armRRef.current.rotation.z, -Math.sin(t * 1.2) * 0.12 - 0.08, 0.05)
        if (bodyRef.current)  bodyRef.current.rotation.z  = MathUtils.lerp(bodyRef.current.rotation.z,   0, 0.05)
        if (bodyRef.current)  bodyRef.current.rotation.x  = MathUtils.lerp(bodyRef.current.rotation.x,   0, 0.05)
        if (legLRef.current)  legLRef.current.rotation.x  = MathUtils.lerp(legLRef.current.rotation.x,  Math.sin(t * 1.2) * 0.15, 0.05)
        if (legRRef.current)  legRRef.current.rotation.x  = MathUtils.lerp(legRRef.current.rotation.x, -Math.sin(t * 1.2) * 0.15, 0.05)
      }
    }
  })

  const kitColor   = color
  const shortColor = '#111133'
  const sockColor  = '#ffffff'
  const skinColor  = '#d4956a'
  const shoeColor  = '#1a1a1a'

  return (
    <group ref={groupRef} position={position} rotation={[0, facingAngle, 0]} frustumCulled={false}>

      {/* ── CONTACT SHADOW — ellipse directly under feet ─────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} scale={[1, 0.73, 1]}>
        <circleGeometry args={[0.52, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.30} depthWrite={false} />
      </mesh>

      {/* ── BOOTS ── */}
      <mesh position={[-0.18, 0.12, 0.08]}>
        <boxGeometry args={[0.18, 0.14, 0.34]} />
        <meshStandardMaterial color={shoeColor} roughness={0.45} />
      </mesh>
      <mesh position={[0.18, 0.12, 0.08]}>
        <boxGeometry args={[0.18, 0.14, 0.34]} />
        <meshStandardMaterial color={shoeColor} roughness={0.45} />
      </mesh>

      {/* ── SOCKS ── */}
      <mesh position={[-0.18, 0.36, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.38, 8]} />
        <meshStandardMaterial color={sockColor} />
      </mesh>
      <mesh position={[0.18, 0.36, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.38, 8]} />
        <meshStandardMaterial color={sockColor} />
      </mesh>

      {/* ── SHORTS ── */}
      <mesh position={[-0.15, 0.72, 0]}>
        <cylinderGeometry args={[0.12, 0.10, 0.44, 8]} />
        <meshStandardMaterial color={shortColor} />
      </mesh>
      <mesh position={[0.15, 0.72, 0]}>
        <cylinderGeometry args={[0.12, 0.10, 0.44, 8]} />
        <meshStandardMaterial color={shortColor} />
      </mesh>

      {/* ── THIGHS ── */}
      <mesh ref={legLRef} position={[-0.16, 0.96, 0]}>
        <cylinderGeometry args={[0.13, 0.12, 0.40, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh ref={legRRef} position={[0.16, 0.96, 0]}>
        <cylinderGeometry args={[0.13, 0.12, 0.40, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* ── TORSO / KIT ── */}
      <mesh ref={bodyRef} position={[0, 1.38, 0]} castShadow>
        <boxGeometry args={[0.58, 0.78, 0.35]} />
        <meshStandardMaterial color={kitColor} roughness={0.68} />
      </mesh>

      {/* Kit number plate */}
      <mesh position={[0, 1.42, 0.185]}>
        <planeGeometry args={[0.22, 0.22]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.65} />
      </mesh>

      {/* ── ARMS ── */}
      <mesh ref={armLRef} position={[-0.39, 1.38, 0]} rotation={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.08, 0.07, 0.64, 8]} />
        <meshStandardMaterial color={kitColor} roughness={0.68} />
      </mesh>
      <mesh ref={armRRef} position={[0.39, 1.38, 0]} rotation={[0, 0, -0.15]}>
        <cylinderGeometry args={[0.08, 0.07, 0.64, 8]} />
        <meshStandardMaterial color={kitColor} roughness={0.68} />
      </mesh>

      {/* Hands */}
      <mesh position={[-0.46, 1.08, 0]}>
        <sphereGeometry args={[0.075, 8, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[0.46, 1.08, 0]}>
        <sphereGeometry args={[0.075, 8, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* ── NECK ── */}
      <mesh position={[0, 1.83, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.22, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* ── HEAD ── */}
      <group ref={headRef} position={[0, 2.07, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.24, 22, 22]} />
          <meshStandardMaterial color={skinColor} roughness={0.84} />
        </mesh>
        {/* Hair */}
        <mesh position={[0, 0.1, -0.02]}>
          <sphereGeometry args={[0.235, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#2a1a0a" roughness={0.95} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.095, 0.02, 0.22]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0.095, 0.02, 0.22]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      </group>

      {/* ── LABEL ── */}
      <Text
        position={[0, 2.78, 0]}
        fontSize={0.26}
        color={isActive ? '#f0c040' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.028}
        outlineColor="#000000"
        frustumCulled={false}
      >
        {label}
      </Text>

      {/* Active golden ring */}
      {isActive && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry args={[0.56, 0.74, 32]} />
          <meshStandardMaterial
            color="#f0c040"
            transparent
            opacity={0.72}
            emissive="#f0c040"
            emissiveIntensity={0.55}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}
