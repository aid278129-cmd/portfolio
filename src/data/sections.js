import { Vector3 } from 'three'

// ══════════════════════════════════════════════════════════════════════════
//  PROFESSIONAL IDENTITY PLAYBOOK
//  Three passes representing the three pillars of Full-Stack development.
//  Ball navigates through a tactical 4-3-2-1 defensive block (10 + GK).
// ══════════════════════════════════════════════════════════════════════════

// ── Attacking chain: our player who carries the ball ─────────────────────
export const PLAYER_CHAIN = [
  {
    id: 'kickoff',
    label: 'Kick-off',
    position: new Vector3(0, 0, 43),
    tStart: 0.00, tEnd: 0.22,
    role: 'idle',
    skinTone: 2, hairColor: 0,
  },
  {
    id: 'foundation',
    label: 'Foundation',
    position: new Vector3(-8, 0, 16),
    tStart: 0.22, tEnd: 0.46,
    role: 'pass',
    skinTone: 0, hairColor: 2,
    card: {
      title: 'Pass 1 — The Foundation',
      subtitle: 'Web Development Fundamentals',
      items: [
        { label: 'HTML5 / Semantic Markup',     level: 97 },
        { label: 'CSS3 / Flexbox / Grid',       level: 95 },
        { label: 'JavaScript (ES2023+)',         level: 93 },
        { label: 'Google Apps Script',          level: 88 },
        { label: 'Responsive Design',           level: 94 },
        { label: 'Web Accessibility (WCAG)',     level: 85 },
      ],
    },
  },
  {
    id: 'logic',
    label: 'Logic',
    position: new Vector3(9, 0, -4),
    tStart: 0.46, tEnd: 0.70,
    role: 'pass',
    skinTone: 3, hairColor: 1,
    card: {
      title: 'Pass 2 — The Logic',
      subtitle: 'Full-Stack & Programming',
      items: [
        { label: 'React / Next.js',             level: 65 },
        { label: 'Node.js / Express / REST',    level: 62 },
        { label: 'TypeScript',                  level: 40 },
        { label: 'Python / FastAPI',            level: 64 },
        { label: 'PostgreSQL / Redis / Mongo',  level: 86 },
        { label: 'GraphQL / tRPC',              level: 42 },
      ],
    },
  },
  {
    id: 'innovation',
    label: 'Innovation',
    position: new Vector3(-5, 0, -26),
    tStart: 0.70, tEnd: 0.88,
    role: 'kick',               // shoot state triggers at tEnd
    skinTone: 1, hairColor: 3,
    card: {
      title: 'Pass 3 — The Innovation',
      subtitle: 'UI/UX & Modern Aesthetics',
      items: [
        { label: 'Glassmorphism / Neumorphism', level: 96 },
        { label: 'Framer Motion / GSAP',        level: 91 },
        { label: 'Three.js / WebGL / R3F',      level: 88 },
        { label: 'Figma → Code Workflows',      level: 90 },
        { label: 'Animated Components / Lottie',level: 89 },
        { label: 'Design Systems / Tokens',     level: 87 },
      ],
    },
  },
]

// Goal geometry
export const GOAL_LINE_Z = -46.5
export const GOAL_NET_TARGET = new Vector3(2.8, 2.05, -50.5)   // top-right corner, deep in net

// ── Collision zones (card UI triggers) derived from chain ─────────────────
export const COLLISION_ZONES = PLAYER_CHAIN
  .filter(p => p.card)
  .map(p => ({
    id: p.id,
    enter: p.tStart + 0.02,
    exit:  p.tEnd  - 0.02,
    cameraZoom: true,
    card: p.card,
  }))

// ══════════════════════════════════════════════════════════════════════════
//  TACTICAL DEFENSIVE BLOCK — 4-3-2-1 formation (10 outfield + GK)
//  Labels = technical challenges our skills bypass.
//  Strictly 10 defenders + 1 goalkeeper.
// ══════════════════════════════════════════════════════════════════════════

// Back-4 defensive line (z ≈ 28–35, opponents' half)
const D_BACK = [
  { id: 'd1',  pos: new Vector3(-12, 0, 32), label: 'Scalability',   kit: '#c41c00', skin: 1, hair: 0 },
  { id: 'd2',  pos: new Vector3( -4, 0, 30), label: 'Legacy Code',   kit: '#c41c00', skin: 3, hair: 1 },
  { id: 'd3',  pos: new Vector3(  4, 0, 30), label: 'Tech Debt',     kit: '#c41c00', skin: 0, hair: 2 },
  { id: 'd4',  pos: new Vector3( 12, 0, 32), label: 'Cross-Browser', kit: '#c41c00', skin: 2, hair: 0 },
]

// Midfield-3 (z ≈ 8–14)
const D_MID = [
  { id: 'd5',  pos: new Vector3(-10, 0, 12), label: 'State Mgmt',   kit: '#880099', skin: 0, hair: 3 },
  { id: 'd6',  pos: new Vector3(  0, 0, 10), label: 'API Design',   kit: '#880099', skin: 2, hair: 0 },
  { id: 'd7',  pos: new Vector3( 10, 0, 12), label: 'Performance',  kit: '#880099', skin: 1, hair: 1 },
]

// Attacking-mid pair (z ≈ -8 to -14)
const D_ATT = [
  { id: 'd8',  pos: new Vector3( -7, 0, -10), label: 'Deadlines',    kit: '#005588', skin: 3, hair: 0 },
  { id: 'd9',  pos: new Vector3(  7, 0, -10), label: 'Scope Creep',  kit: '#005588', skin: 0, hair: 2 },
]

// Striker (z ≈ -20, pressing deep)
const D_STR = [
  { id: 'd10', pos: new Vector3(  0, 0, -20), label: 'Complexity',   kit: '#004400', skin: 1, hair: 0 },
]

export const DEFENDERS = [...D_BACK, ...D_MID, ...D_ATT, ...D_STR]

// Goalkeeper — positioned left-centre; ball goes top-right corner
export const GOALKEEPER = {
  id: 'gk',
  position: new Vector3(-1.2, 0, -47.5),
  label: 'GK',
  skinTone: 2,
  hairColor: 1,
}

export const SECTION_LABELS = [
  { t: 0.00, label: 'Kick-off',    sublabel: 'The Beginning' },
  { t: 0.30, label: 'Foundation',  sublabel: 'Web Dev Fundamentals' },
  { t: 0.56, label: 'Logic',       sublabel: 'Full-Stack & Programming' },
  { t: 0.78, label: 'Innovation',  sublabel: 'UI/UX & Modern Aesthetics' },
  { t: 1.00, label: 'GOAL!',       sublabel: 'Let\'s Work Together' },
]
