import { motion, AnimatePresence } from 'framer-motion'

export function HeroOverlay({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'fixed',
            top: '50%',
            left: '2rem',
            transform: 'translateY(-50%)',
            zIndex: 100,
            pointerEvents: 'none',
            maxWidth: '500px',
          }}
        >
          <motion.p
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#f0c040',
              marginBottom: '0.5rem',
            }}
          >
            Portfolio · Championship Run
          </motion.p>

          <motion.h1
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(2.8rem, 8vw, 6.5rem)',
              lineHeight: 0.95,
              color: '#ffffff',
              letterSpacing: '0.04em',
              marginBottom: '1rem',
              textShadow: '0 4px 24px rgba(0,0,0,0.65)',
            }}
          >
            Front-End Developer<br />
            <span style={{ color: '#f0c040' }}>& Creative Coder</span>
          </motion.h1>

          <motion.p
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.38 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1.1rem',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '1rem',
              letterSpacing: '0.02em',
            }}
          >
            Shri
          </motion.p>

          <motion.p
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.95rem',
              color: 'rgba(255,255,255,0.62)',
              maxWidth: '330px',
              lineHeight: 1.65,
              marginBottom: '1.25rem',
            }}
          >
            Foundation → Logic → Innovation.<br />
            Scroll to watch the championship run unfold.
          </motion.p>

          {/* Three pillar chips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
          >
            {['Web Fundamentals', 'Full-Stack Logic', 'UI/UX Innovation'].map((tag, i) => (
              <span key={i} style={{
                padding: '4px 12px',
                background: 'rgba(240,192,64,0.12)',
                border: '1px solid rgba(240,192,64,0.35)',
                borderRadius: '20px',
                fontSize: '11px',
                color: '#f0c040',
                letterSpacing: '0.05em',
                fontFamily: "'Inter', sans-serif",
              }}>{tag}</span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ delay: 1.2, duration: 1.8, repeat: Infinity, repeatDelay: 1 }}
            style={{
              marginTop: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'rgba(255,255,255,0.38)',
              fontSize: '12px',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.12em',
            }}
          >
            <span>↓</span> SCROLL TO PLAY
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
