import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function DataCard({ zone }) {
  const card = zone?.card
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const baseStyle = {
    position: 'fixed',
    background: 'rgba(10, 10, 10, 0.88)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(240, 192, 64, 0.3)',
    borderRadius: '16px',
    padding: isMobile ? '1rem' : '1.5rem',
    zIndex: 100,
    boxShadow: '0 0 40px rgba(240, 192, 64, 0.12)',
    ...(isMobile
      ? { bottom: '1rem', left: '1rem', right: '1rem', top: 'auto', transform: 'none', width: 'auto' }
      : { right: '2rem', top: '50%', transform: 'translateY(-50%)', width: 'min(340px, calc(100vw - 4rem))' }
    ),
  }

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          key={zone.id}
          initial={{ opacity: 0, x: isMobile ? 0 : 60, scale: 0.92 }}
          animate={{ opacity: 1, x: 0,  scale: 1 }}
          exit={{    opacity: 0, x: isMobile ? 0 : 60, scale: 0.92 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={baseStyle}
        >
          {/* Gold accent bar */}
          <div style={{
            width: '40px',
            height: '3px',
            background: 'linear-gradient(90deg, #f0c040, #c49a20)',
            borderRadius: '2px',
            marginBottom: '0.75rem',
          }} />

          <p style={{
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#f0c040',
            marginBottom: '0.25rem',
            fontWeight: 500,
          }}>
            {card.subtitle}
          </p>

          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: isMobile ? '1.4rem' : '2rem',
            letterSpacing: '0.05em',
            color: '#ffffff',
            marginBottom: isMobile ? '0.75rem' : '1.25rem',
            lineHeight: 1,
          }}>
            {card.title}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {card.items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.07, duration: 0.4 }}
              >
                <div style={{
                  padding: '0.6rem 0.75rem',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '8px',
                  borderLeft: '2px solid rgba(240, 192, 64, 0.5)',
                }}>
                  <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 500 }}>
                    {item.label}
                  </div>
                  {item.desc && (
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                      {item.desc}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
