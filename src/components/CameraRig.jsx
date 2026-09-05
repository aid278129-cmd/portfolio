import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, MathUtils, CatmullRomCurve3 } from 'three'
import { PLAYER_CHAIN } from '../data/sections.js'

// Build a smooth camera follow-path through each chain player's position.
// PATH_POINTS was removed when we switched to the possession system —
// the camera now tracks the same waypoints the ball travels through.
const CAMERA_PATH_POINTS = [
  ...PLAYER_CHAIN.map(p => p.position.clone()),
  new Vector3(0, 0.4, -46), // final point deep in goal
]
const path = new CatmullRomCurve3(CAMERA_PATH_POINTS, false, 'catmullrom', 0.5)

const NORMAL_OFFSET = new Vector3(0, 10, 20)
const ZOOM_OFFSET   = new Vector3(0,  6, 13)
const GOAL_OFFSET   = new Vector3(0,  4,  8)

export function CameraRig({ progress, isZoomed, isGoal }) {
  const { camera } = useThree()
  const smoothPos  = useRef(new Vector3(0, 10, 65))
  const lookTarget = useRef(new Vector3())
  const smoothT    = useRef(0)

  useFrame(() => {
    smoothT.current += (progress - smoothT.current) * 0.05
    const t = Math.max(0, Math.min(1, smoothT.current))
    const point = path.getPoint(t)

    const offset = isGoal ? GOAL_OFFSET : isZoomed ? ZOOM_OFFSET : NORMAL_OFFSET
    const idealPos = point.clone().add(offset)

    smoothPos.current.lerp(idealPos, 0.06)
    camera.position.copy(smoothPos.current)

    const lookAhead = point.clone()
    lookTarget.current.lerp(lookAhead, 0.08)
    camera.lookAt(lookTarget.current)

    const targetFov = isGoal ? 30 : isZoomed ? 42 : 60
    camera.fov = MathUtils.lerp(camera.fov, targetFov, 0.04)
    camera.updateProjectionMatrix()
  })

  return null
}
