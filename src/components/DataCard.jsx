import { motion, AnimatePresence } from 'framer-motion'

export function DataCard({ zone }) {
  const card = zone?.card

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          key={zone.id}
          initial={{ opacity: 0, x: 60, scale: 0.92 }}
          animate={{ opacity: 1, x: 0,  scale: 1 }}
          exit={{    opacity: 0, x: 60, scale: 0.92 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed',
            right: '2rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 'min(340px, calc(100vw - 4rem))',
            background: 'rgba(10, 10, 10, 0.88)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(240, 192, 64, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            zIndex: 100,
            boxShadow: '0 0 40px rgba(240, 192, 64, 0.12)',
          }}
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
            fontSize: '2rem',
            letterSpacing: '0.05em',
            color: '#ffffff',
            marginBottom: '1.25rem',
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
                {/* Skill bar style */}
                {item.level !== undefined ? (
                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}>
                      <span style={{ fontSize: '13px', color: '#e0e0e0', fontWeight: 500 }}>
                        {item.label}
                      </span>
                      <span style={{ fontSize: '12px', color: '#f0c040' }}>
                        {item.level}%
                      </span>
                    </div>
                    <div style={{
                      height: '4px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.level}%` }}
                        transition={{ delay: 0.3 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, #f0c040, #c49a20)',
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Project / experience style */
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
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
