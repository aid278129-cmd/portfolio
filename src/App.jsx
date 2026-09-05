import { useState, useCallback, useEffect, useRef, Suspense } from 'react'
import { Scene } from './components/Scene.jsx'
import { DataCard } from './components/DataCard.jsx'
import { HUD } from './components/HUD.jsx'
import { HeroOverlay } from './components/HeroOverlay.jsx'
import { GoalCelebration } from './components/GoalCelebration.jsx'
import { useCollisions } from './hooks/useCollisions.js'

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#080c14',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    }}>
      <div style={{
        fontSize: '3rem',
        animation: 'pulse 1s ease-in-out infinite',
      }}>⚽</div>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '13px',
        color: '#f0c040',
        letterSpacing: '0.15em',
        marginTop: '1rem',
      }}>
        Loading the pitch…
      </p>
    </div>
  )
}

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
      {/* Tall scroll container — 400vh = full match */}
      <div style={{ height: '400vh', background: 'transparent', pointerEvents: 'none' }} />

      {/* Fixed 3D scene */}
      <Suspense fallback={<LoadingScreen />}>
        <Scene
          progress={progress}
          isZoomed={isZoomed}
          isGoal={isGoal}
          activeDefenders={activeDefenders}
          onGoal={handleGoal}
        />
      </Suspense>

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
