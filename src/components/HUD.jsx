import { motion } from 'framer-motion'
import { SECTION_LABELS } from '../data/sections.js'

export function HUD({ progress, activeZone }) {
  const currentSection = SECTION_LABELS.reduce((prev, curr) =>
    Math.abs(curr.t - progress) < Math.abs(prev.t - progress) ? curr : prev
  )

  return (
    <>
      {/* Top bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'rgba(255,255,255,0.08)',
        zIndex: 50,
      }}>
        <motion.div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #f0c040, #c49a20)',
            transformOrigin: 'left',
          }}
          animate={{ scaleX: progress }}
          transition={{ duration: 0 }}
        />
      </div>

      {/* Section label bottom-left */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        left: '2rem',
        zIndex: 50,
        pointerEvents: 'none',
      }}>
        <p style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '2.2rem',
          color: '#ffffff',
          lineHeight: 1,
          letterSpacing: '0.08em',
          textShadow: '0 2px 12px rgba(0,0,0,0.8)',
        }}>
          {currentSection.label}
        </p>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '11px',
          color: 'rgba(240,192,64,0.8)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          marginTop: '2px',
        }}>
          {currentSection.sublabel}
        </p>
      </div>

      {/* Section dots (right side) */}
      <div style={{
        position: 'fixed',
        right: '1.25rem',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 50,
        pointerEvents: 'none',
      }}>
        {SECTION_LABELS.map((s, i) => {
          const isActive = Math.abs(s.t - progress) < 0.12
          return (
            <motion.div
              key={i}
              animate={{
                width: isActive ? 24 : 6,
                background: isActive ? '#f0c040' : 'rgba(255,255,255,0.3)',
              }}
              style={{
                height: '6px',
                borderRadius: '3px',
              }}
              transition={{ duration: 0.3 }}
            />
          )
        })}
      </div>

      {/* Scroll hint (fades after scrolling) */}
      {progress < 0.04 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', letterSpacing: '0.1em' }}
          >
            ↓ scroll to play
          </motion.div>
        </motion.div>
      )}
    </>
  )
}
