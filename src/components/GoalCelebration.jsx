import { motion, AnimatePresence } from 'framer-motion'

const CONFETTI_COLORS = ['#f0c040', '#ffffff', '#4488ff', '#22aa55', '#ff4422', '#ff8800']

function Particle({ delay, color }) {
  const x = (Math.random() - 0.5) * 120
  const y = -(40 + Math.random() * 60)
  const rot = Math.random() * 720
  const size = 4 + Math.random() * 6
  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
      animate={{ x, y, opacity: 0, rotate: rot, scale: 0.4 }}
      transition={{ duration: 1.2 + Math.random() * 0.8, delay, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        width: size, height: size,
        background: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        pointerEvents: 'none',
      }}
    />
  )
}

export function GoalCelebration({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* Cinematic flash */}
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            style={{ position: 'absolute', inset: 0, background: '#fff0a0', zIndex: 1 }}
          />

          {/* Confetti burst */}
          <div style={{ position: 'absolute', top: '48%', left: '50%', zIndex: 2 }}>
            {Array.from({ length: 40 }).map((_, i) => (
              <Particle
                key={i}
                delay={i * 0.018}
                color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
              />
            ))}
          </div>

          {/* GOAL text */}
          <div style={{ position: 'relative', zIndex: 3, textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 30 }}
              animate={{ scale: 1,   opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.15 }}
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(5rem, 16vw, 14rem)',
                color: '#f0c040',
                lineHeight: 1,
                letterSpacing: '0.06em',
                textShadow: '0 0 60px rgba(240,192,64,0.8), 0 0 120px rgba(240,192,64,0.35)',
              }}
            >
              GOAL!
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1.1rem',
                color: 'rgba(255,255,255,0.8)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginTop: '0.5rem',
              }}
            >
              Foundation → Logic → Innovation → 🏆
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,0.55)',
                marginTop: '0.75rem',
                letterSpacing: '0.08em',
              }}
            >
              Let's build something great together
            </motion.p>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 }}
              style={{
                marginTop: '1.5rem',
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #f0c040, #c49a20)',
                color: '#000',
                border: 'none',
                borderRadius: '40px',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: '0.95rem',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                pointerEvents: 'all',
                boxShadow: '0 4px 24px rgba(240,192,64,0.4)',
              }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Watch the Replay ↑
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
