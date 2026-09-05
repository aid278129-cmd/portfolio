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

const NORMAL_OFFSET = new Vector3(0, 10, 20)
const ZOOM_OFFSET   = new Vector3(0,  6, 13)
const GOAL_OFFSET   = new Vector3(0,  4,  8)

function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t }

export function CameraRig({ progress, isZoomed, isGoal }) {
  const { camera } = useThree()
  const smoothPos     = useRef(new Vector3(0, 10, 65))
  const lookPrimary   = useRef(new Vector3())
  const lookSecondary = useRef(new Vector3())
  const smoothT       = useRef(0)
  const zoomT         = useRef(0)
  const zoomFromFov   = useRef(60)
  const zoomFromOffset = useRef(NORMAL_OFFSET.clone())
  const goalDrift     = useRef(0)

  useFrame(() => {
    // Scroll progress lerp — 40% slower (0.05 → 0.03)
    smoothT.current += (progress - smoothT.current) * 0.03
    const t = Math.max(0, Math.min(1, smoothT.current))
    const point = path.getPoint(t)

    // ── Zoom transition: eased over ~3 seconds ──────────────────
    const targetOffset = isGoal ? GOAL_OFFSET : isZoomed ? ZOOM_OFFSET : NORMAL_OFFSET
    if (isZoomed || isGoal) {
      zoomT.current = Math.min(zoomT.current + 0.018, 1)
    } else {
      zoomT.current = Math.max(zoomT.current - 0.018, 0)
      zoomFromOffset.current.copy(targetOffset)
    }
    const easedT = easeInOut(zoomT.current)
    const activeOffset = zoomFromOffset.current.clone().lerp(targetOffset, easedT)

    const idealPos = point.clone().add(activeOffset)

    // Camera position lerp — 40% slower (0.06 → 0.036)
    smoothPos.current.lerp(idealPos, 0.036)
    camera.position.copy(smoothPos.current)

    // ── Goal crane drift: slow upward nudge ──────────────────────
    if (isGoal) {
      goalDrift.current = Math.min(goalDrift.current + 0.008, 4)
      camera.position.y += goalDrift.current
    } else {
      goalDrift.current = 0
    }

    // ── Double-lerp lookAt for silky smooth tracking ────────────
    const lookAhead = point.clone()
    // Primary lerp (0.08 → 0.048, 40% slower)
    lookPrimary.current.lerp(lookAhead, 0.048)
    // Secondary lerp at 0.035 for extra smoothness
    lookSecondary.current.lerp(lookPrimary.current, 0.035)
    camera.lookAt(lookSecondary.current)

    // FOV lerp — 40% slower (0.04 → 0.024)
    const targetFov = isGoal ? 30 : isZoomed ? 42 : 60
    camera.fov = MathUtils.lerp(camera.fov, targetFov, 0.024)
    camera.updateProjectionMatrix()
  })

  return null
}
