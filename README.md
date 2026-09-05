# Championship Run v4 — High-Fidelity Upgrade

## What's New (v4 vs v3)

### 1. Character Overhaul — Fully Articulated Humanoids
- **`HumanoidPlayer.jsx`** — new component replacing all cylinder/box primitives
- Anatomically structured: skull, jaw, neck, shoulders, upper/lower arms, forearms, hands, torso, hips, upper/lower legs, feet with boots, shin guards, socks
- 5 skin tone variants × 4 hair colors = diverse team
- Kit details: collar, chest panel, number badge, shoulder stripes, waistband, sock bands
- **Full AnimationMixer state machine:**
  - `idle` — breathing bob, subtle arm sway
  - `run` — proper running gait with opposing arm/leg swing, knee lift
  - `dribble` — faster run cycle
  - `pass` — lean forward, push gesture
  - `shoot` — windup → contact → follow-through
  - `defend` — wide stance, arms spread, weight shift
  - `celebrate` — arms pump, jump
- **LookAt tracking** — head and spine Quaternion-rotate to face ball when within 22 units

### 2. Bezier Curve Pass Arcs
- **`Ball.jsx`** — fully rewritten
- Every pass between players follows a **QuadraticBezierCurve** with:
  - Y-axis apex height = 22% of pass distance (realistic loft)
  - `easeInOut` timing for natural acceleration/deceleration
  - Ground bounce during dribble phase (`Math.abs(Math.sin) * 0.12`)
- Shot uses an `easeOut` Bezier into the net

### 3. Doubled Player Count
- `DEFENDERS` in `sections.js` increased from 7 → 15 players
- Three color-coded opponent kits: red (`#cc2200`), dark orange (`#b84400`), maroon (`#8a0033`), purple (`#5500aa`)
- Goalkeeper added at goal mouth in distinctive orange GK kit
- Players in `skills` / `projects` / `experience` transition zones

### 4. Crowd Overhaul
- **`CrowdStands.jsx`** — replaces colored cylinder spectators
- Instanced billboard sprites using a canvas-drawn atlas of 8 crowd silhouette variants
- Billboarding: each instance rotates to face camera every frame (1 draw call)
- ~1400+ crowd instances across all four stands
- `StadiumSeats` — dark colored seat planes behind crowd for visual mass

### 5. Night Match Atmosphere
- **Procedural CubeTexture skybox** — 6 canvas-drawn faces featuring:
  - Deep indigo night sky with 250+ stars per face
  - Stadium floodlight glow at horizon
  - Volumetric light cone hints pointing down
  - Stadium roof silhouette with architectural detail
  - City glow/green turf reflection at ground level
- **Cinematic lighting rig:**
  - 4× stadium floodspot `SpotLight` at 800 intensity, angle 0.60, sharp shadows
  - `shadow-mapSize={[1024,1024]}` on all casters
  - Cool blue fill `PointLight` × 4 from sides for depth separation
  - Warm `PointLight` at both goals for net visibility
  - High center pitch key light
  - Very low ambient (0.08) — all light comes from practical sources
- **FloodlightTowers** — detailed pylon geometry with emissive housing + volumetric `FloodBeam` cones using `BackSide` cone geometry
- **Contact shadows** — every player and ball has a crisp disc + soft penumbra ring directly beneath them

## Running Locally

```bash
cd championship-run-v4
npm install
npm run dev
```

Requires Node.js 18+. Open http://localhost:5173

## Dependencies (unchanged from v3)
```json
"@react-three/drei": "^9.99.0",
"@react-three/fiber": "^8.15.0",
"three": "^0.161.0",
"react": "^18.2.0",
"framer-motion": "^11.0.0"
```
