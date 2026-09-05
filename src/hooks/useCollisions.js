import { useRef, useCallback } from 'react'
import { COLLISION_ZONES } from '../data/sections.js'

export function useCollisions(onEnter, onExit) {
  const activeZone = useRef(null)

  const check = useCallback((t) => {
    const zone = COLLISION_ZONES.find(z => t >= z.enter && t <= z.exit) ?? null
    const zoneId = zone?.id ?? null

    if (zoneId !== activeZone.current) {
      if (activeZone.current) onExit?.(activeZone.current)
      if (zone)               onEnter?.(zone)
      activeZone.current = zoneId
    }
  }, [onEnter, onExit])

  return { check, activeZone }
}
