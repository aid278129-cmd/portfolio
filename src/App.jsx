import { useState, useCallback, useEffect, useRef } from 'react'
import { Scene } from './components/Scene.jsx'
import { DataCard } from './components/DataCard.jsx'
import { HUD } from './components/HUD.jsx'
import { HeroOverlay } from './components/HeroOverlay.jsx'
import { GoalCelebration } from './components/GoalCelebration.jsx'
import { useCollisions } from './hooks/useCollisions.js'

export default function App() {
  const [progress, setProgress]     = useState(0)
  const [activeZone, setActiveZone] = useState(null)
  const [isZoomed, setIsZoomed]     = useState(false)
  const [isGoal, setIsGoal]         = useState(false)
  const goalLocked                  = useRef(false)

  const handleEnter = useCallback((zone) => {
    setActiveZone(zone)
    setIsZoomed(zone.cameraZoom ?? false)
    // NOTE: Do NOT set isGoal here — it must only fire when ball crosses goal line
  }, [])

  const handleExit = useCallback(() => {
    setActiveZone(null)
    setIsZoomed(false)
  }, [])

  // Called by Ball component only after ball.position.z <= GOAL_LINE_Z
  const handleGoal = useCallback(() => {
    if (!goalLocked.current) {
      goalLocked.current = true
      setIsGoal(true)
    }
  }, [])

  const { check: checkCollisions } = useCollisions(handleEnter, handleExit)

  useEffect(() => {
    const onScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight
      const t = maxScroll > 0 ? window.scrollY / maxScroll : 0
      setProgress(t)
      checkCollisions(t)

      // Reset goal if user scrolls back
      if (t < 0.80) {
        goalLocked.current = false
        setIsGoal(false)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [checkCollisions])

  const activeDefenders = activeZone?.id ? [activeZone.id] : []

  return (
    <>
      {/* Tall scroll container — 600vh = full match */}
      <div style={{ height: '600vh', background: 'transparent', pointerEvents: 'none' }} />

      {/* Fixed 3D scene */}
      <Scene
        progress={progress}
        isZoomed={isZoomed}
        isGoal={isGoal}
        activeDefenders={activeDefenders}
        onGoal={handleGoal}
      />

      {/* UI layers */}
      <HUD progress={progress} activeZone={activeZone} />
      <HeroOverlay visible={progress < 0.08} />
      <DataCard zone={activeZone} />
      <GoalCelebration visible={isGoal} />

      {/* Vignette */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.58) 100%)',
        pointerEvents: 'none',
        zIndex: 3,
      }} />
    </>
  )
}
