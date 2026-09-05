import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, MathUtils, CatmullRomCurve3 } from 'three'
import { PLAYER_CHAIN } from '../data/sections.js'

// Build a smooth camera follow-path through each chain player's position.
const CAMERA_PATH_POINTS = [
  ...PLAYER_CHAIN.map(p => p.position.clone()),
  new Vector3(0, 0.4, -46), // final point deep in goal
]
const path = new CatmullRomCurve3(CAMERA_PATH_POINTS, false, 'catmullrom', 0.5)

// ── Camera angle presets ──────────────────────────────────────────────────
// Each mode has its own height, distance, and lateral offset for variety.
// Normal: wide broadcast angle, slightly elevated, gentle side bias
const NORMAL_OFFSET = new Vector3(3, 12, 24)
// Zoom: lower, tighter, angled slightly from the side for dramatic close-ups
const ZOOM_OFFSET   = new Vector3(2.5, 5.5, 12)
// Goal: low dynamic angle behind the shooter, looking toward the net
const GOAL_OFFSET   = new Vector3(1.5, 3.5, 10)

function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t }

export function CameraRig({ progress, isZoomed, isGoal }) {
  const { camera } = useThree()
  const smoothPos       = useRef(new Vector3(3, 12, 65))
  const lookPrimary     = useRef(new Vector3())
  const lookSecondary   = useRef(new Vector3())
  const smoothT         = useRef(0)
  const zoomT           = useRef(0)
  const zoomFromOffset  = useRef(NORMAL_OFFSET.clone())
  const goalDrift       = useRef(0)
  const lateralSway     = useRef(0)

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime()

    // Scroll progress lerp — heavier inertia for cinematic drag
    smoothT.current += (progress - smoothT.current) * 0.02
    const t = Math.max(0, Math.min(1, smoothT.current))
    const point = path.getPoint(t)

    // ── Zoom transition: eased over ~3.5 seconds ──────────────────
    const targetOffset = isGoal ? GOAL_OFFSET : isZoomed ? ZOOM_OFFSET : NORMAL_OFFSET
    if (isZoomed || isGoal) {
      zoomT.current = Math.min(zoomT.current + 0.014, 1)
    } else {
      zoomT.current = Math.max(zoomT.current - 0.014, 0)
      zoomFromOffset.current.copy(targetOffset)
    }
    const easedT = easeInOut(zoomT.current)
    const activeOffset = zoomFromOffset.current.clone().lerp(targetOffset, easedT)

    // ── Subtle lateral sway for organic, hand-held feel ───────────
    lateralSway.current = Math.sin(elapsed * 0.3) * 1.2
    const swayOffset = new Vector3(lateralSway.current, 0, 0)

    const idealPos = point.clone().add(activeOffset).add(swayOffset)

    // Camera position — triple-lerp for maximum smoothness
    // Primary lerp toward ideal
    smoothPos.current.lerp(idealPos, 0.022)

    // ── Goal crane drift: slow upward nudge ──────────────────────
    if (isGoal) {
      goalDrift.current = Math.min(goalDrift.current + 0.006, 4.5)
      smoothPos.current.y += goalDrift.current * 0.02
    } else {
      goalDrift.current = Math.max(goalDrift.current - 0.01, 0)
    }

    camera.position.copy(smoothPos.current)

    // ── Triple-lerp lookAt for silky smooth tracking ──────────────
    const lookAhead = point.clone()
    // Look slightly ahead on the path for anticipatory feel
    const lookAheadT = Math.min(t + 0.03, 1)
    const lookAheadPoint = path.getPoint(lookAheadT)
    // Blend current point with ahead point
    lookAhead.lerp(lookAheadPoint, 0.4)

    // Primary lerp
    lookPrimary.current.lerp(lookAhead, 0.03)
    // Secondary lerp
    lookSecondary.current.lerp(lookPrimary.current, 0.022)
    camera.lookAt(lookSecondary.current)

    // FOV lerp — slower for smooth zoom feel
    const targetFov = isGoal ? 32 : isZoomed ? 44 : 58
    camera.fov = MathUtils.lerp(camera.fov, targetFov, 0.016)
    camera.updateProjectionMatrix()
  })

  return null
}
