import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { MathUtils } from 'three'

/**
 * ChainPlayer — one of the "attackers" in the passing chain.
 * Transitions between:
 *   - 'idle'    : standing, gentle head/body sway
 *   - 'dribble' : active ball control
 *   - 'pass'    : lean-and-push pass gesture
 *   - 'shoot'   : full kicking animation
 */
export function ChainPlayer({ position, label, state = 'idle', color = '#2266cc', facingAngle = Math.PI }) {
  const groupRef  = useRef()
  const bodyRef   = useRef()
  const headRef   = useRef()
  const armLRef   = useRef()
  const armRRef   = useRef()
  const legLRef   = useRef()
  const legRRef   = useRef()
  const kickT     = useRef(0)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()

    // Breathing bob — always present
    groupRef.current.position.y = position.y + Math.sin(t * 1.5) * 0.05

    // Subtle head look
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.6) * 0.18
    }

    if (state === 'shoot') {
      kickT.current = Math.min(kickT.current + 0.04, 1)
      const kp = kickT.current

      const kickAngle = kp < 0.4
        ? MathUtils.lerp(0, -1.3, kp / 0.4)
        : MathUtils.lerp(-1.3, 1.6, (kp - 0.4) / 0.6)

      if (legRRef.current) legRRef.current.rotation.x = kickAngle
      if (legLRef.current) legLRef.current.rotation.x = MathUtils.lerp(legLRef.current.rotation.x, -0.25, 0.14)
      if (bodyRef.current) {
        bodyRef.current.rotation.x = MathUtils.lerp(bodyRef.current.rotation.x, kp > 0.4 ? 0.4 : 0.1, 0.12)
        bodyRef.current.rotation.z = MathUtils.lerp(bodyRef.current.rotation.z, 0, 0.08)
      }
      if (armLRef.current) armLRef.current.rotation.z = MathUtils.lerp(armLRef.current.rotation.z, -1.0, 0.1)
      if (armRRef.current) armRRef.current.rotation.z = MathUtils.lerp(armRRef.current.rotation.z,  0.5, 0.1)

    } else if (state === 'pass') {
      kickT.current = 0
      // Lean forward, push gesture
      if (bodyRef.current) bodyRef.current.rotation.x = MathUtils.lerp(bodyRef.current.rotation.x, 0.28, 0.08)
      if (armLRef.current) armLRef.current.rotation.z = MathUtils.lerp(armLRef.current.rotation.z, -0.3, 0.1)
      if (armRRef.current) armRRef.current.rotation.z = MathUtils.lerp(armRRef.current.rotation.z,  0.1, 0.1)
      if (armLRef.current) armLRef.current.rotation.x = MathUtils.lerp(armLRef.current.rotation.x, -0.6, 0.1)

    } else if (state === 'dribble') {
      kickT.current = 0
      // Running dribble: alternating legs, slight forward lean
      if (bodyRef.current) bodyRef.current.rotation.x = MathUtils.lerp(bodyRef.current.rotation.x, 0.12, 0.06)
      if (legLRef.current) legLRef.current.rotation.x = Math.sin(t * 4.5) * 0.5
      if (legRRef.current) legRRef.current.rotation.x = -Math.sin(t * 4.5) * 0.5
      if (armLRef.current) armLRef.current.rotation.x = -Math.sin(t * 4.5) * 0.3
      if (armRRef.current) armRRef.current.rotation.x =  Math.sin(t * 4.5) * 0.3

    } else {
      // Idle
      kickT.current = 0
      if (bodyRef.current)  bodyRef.current.rotation.x  = MathUtils.lerp(bodyRef.current.rotation.x, 0, 0.05)
      if (bodyRef.current)  bodyRef.current.rotation.z  = Math.sin(t * 0.9) * 0.035
      if (armLRef.current)  armLRef.current.rotation.z  = MathUtils.lerp(armLRef.current.rotation.z,  Math.sin(t * 1.1) * 0.1 + 0.08, 0.05)
      if (armRRef.current)  armRRef.current.rotation.z  = MathUtils.lerp(armRRef.current.rotation.z, -Math.sin(t * 1.1) * 0.1 - 0.08, 0.05)
      if (armLRef.current)  armLRef.current.rotation.x  = MathUtils.lerp(armLRef.current.rotation.x, 0, 0.05)
      if (legLRef.current)  legLRef.current.rotation.x  = MathUtils.lerp(legLRef.current.rotation.x, 0, 0.05)
      if (legRRef.current)  legRRef.current.rotation.x  = MathUtils.lerp(legRRef.current.rotation.x, 0, 0.05)
    }
  })

  const kitColor   = color
  const shortColor = '#0a0a22'
  const sockColor  = '#e8e8e8'
  const skinColor  = '#c8834a'
  const shoeColor  = '#0a0a0a'

  return (
    <group ref={groupRef} position={position} rotation={[0, facingAngle, 0]} frustumCulled={false}>

      {/* Contact shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} scale={[1, 0.73, 1]}>
        <circleGeometry args={[0.52, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.32} depthWrite={false} />
      </mesh>

      {/* Boots */}
      <mesh position={[-0.18, 0.12, 0.08]}>
        <boxGeometry args={[0.18, 0.14, 0.34]} />
        <meshStandardMaterial color={shoeColor} roughness={0.45} />
      </mesh>
      <mesh position={[0.18, 0.12, 0.08]}>
        <boxGeometry args={[0.18, 0.14, 0.34]} />
        <meshStandardMaterial color={shoeColor} roughness={0.45} />
      </mesh>

      {/* Socks */}
      <mesh position={[-0.18, 0.36, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.38, 8]} />
        <meshStandardMaterial color={sockColor} />
      </mesh>
      <mesh position={[0.18, 0.36, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.38, 8]} />
        <meshStandardMaterial color={sockColor} />
      </mesh>

      {/* Shorts */}
      <mesh position={[-0.15, 0.72, 0]}>
        <cylinderGeometry args={[0.12, 0.10, 0.44, 8]} />
        <meshStandardMaterial color={shortColor} />
      </mesh>
      <mesh position={[0.15, 0.72, 0]}>
        <cylinderGeometry args={[0.12, 0.10, 0.44, 8]} />
        <meshStandardMaterial color={shortColor} />
      </mesh>

      {/* Thighs */}
      <mesh ref={legLRef} position={[-0.16, 0.96, 0]}>
        <cylinderGeometry args={[0.13, 0.12, 0.40, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh ref={legRRef} position={[0.16, 0.96, 0]}>
        <cylinderGeometry args={[0.13, 0.12, 0.40, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Torso */}
      <mesh ref={bodyRef} position={[0, 1.38, 0]} castShadow>
        <boxGeometry args={[0.58, 0.78, 0.35]} />
        <meshStandardMaterial color={kitColor} roughness={0.65} metalness={0.05} />
      </mesh>

      {/* Kit accent stripe */}
      <mesh position={[0, 1.50, 0.180]}>
        <planeGeometry args={[0.42, 0.12]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.55} />
      </mesh>

      {/* Arms */}
      <mesh ref={armLRef} position={[-0.40, 1.38, 0]} rotation={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.08, 0.07, 0.64, 8]} />
        <meshStandardMaterial color={kitColor} roughness={0.65} />
      </mesh>
      <mesh ref={armRRef} position={[0.40, 1.38, 0]} rotation={[0, 0, -0.15]}>
        <cylinderGeometry args={[0.08, 0.07, 0.64, 8]} />
        <meshStandardMaterial color={kitColor} roughness={0.65} />
      </mesh>

      {/* Hands */}
      <mesh position={[-0.47, 1.08, 0]}>
        <sphereGeometry args={[0.075, 8, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[0.47, 1.08, 0]}>
        <sphereGeometry args={[0.075, 8, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.84, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.22, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Head */}
      <group ref={headRef} position={[0, 2.08, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.24, 22, 22]} />
          <meshStandardMaterial color={skinColor} roughness={0.83} />
        </mesh>
        <mesh position={[0, 0.1, -0.02]}>
          <sphereGeometry args={[0.235, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1a0e04" roughness={0.95} />
        </mesh>
        <mesh position={[-0.095, 0.02, 0.22]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0.095, 0.02, 0.22]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      </group>

      {/* Name label */}
      <Text
        position={[0, 2.82, 0]}
        fontSize={0.28}
        color="#f0c040"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#000000"
        frustumCulled={false}
      >
        {label}
      </Text>

      {/* Glow ring — always present for chain players */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.60, 0.80, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={state === 'dribble' ? 0.55 : 0.25}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
