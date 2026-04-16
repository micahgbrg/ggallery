# Antigravity Handoff Guide: Museum Virtual Sculpture Gallery

**Purpose:** This document provides everything needed to build this project using Google Antigravity's agent-first development platform. It includes an implementation plan broken into agent-dispatchable tasks, custom Skills to create, and specific guidance for leveraging Antigravity's capabilities.

**Last Updated:** April 16, 2026

---

## 1. Prerequisites

Before opening this project in Antigravity:

1. **Install Node.js** (v20 LTS or later)
2. **Install Google Antigravity** from [antigravity.google](https://antigravity.google)
3. **Clone this repo** and open it as a workspace in Antigravity
4. **Recommended Antigravity settings:**
   - Development mode: Agent-assisted (you stay in control, agent helps with safe automations)
   - Terminal policy: Auto with allow list (allow `npm`, `npx`, `node`, `git`, `vite`)
   - Model: Gemini 3 Pro for architecture/planning tasks; Claude Sonnet 4.6 or Opus 4.6 for complex R3F component implementation

---

## 2. Antigravity Skills to Create

Before starting implementation, create these workspace-scoped Skills in `.agents/skills/`. Each Skill packages domain knowledge that the agent will need repeatedly. This avoids re-prompting the agent with the same context across tasks.

### Skill 1: R3F Component Patterns

```
.agents/skills/r3f-patterns/
├── SKILL.md
└── references/
    └── r3f-cheatsheet.md
```

**`.agents/skills/r3f-patterns/SKILL.md`:**
```markdown
---
name: r3f-patterns
description: React Three Fiber component patterns, Drei utilities, and Three.js conventions used in this project.
---

# R3F Component Patterns

## Core Conventions
- All 3D components live in `src/gallery/` and `src/navigation/`
- Use Drei's `useGLTF` for model loading — never raw `THREE.GLTFLoader`
- Use Drei's `Html` component for HTML overlays positioned in 3D space
- Use `@react-three/fiber`'s `useFrame` for animation loops — never `requestAnimationFrame`
- Use `useThree()` to access the renderer, camera, and scene
- The R3F Canvas uses `frameloop="demand"` — call `invalidate()` to trigger re-renders
- All 3D coordinates follow Three.js convention: Y-up, right-handed

## Loading Pattern
Wrap model-loading components in `<Suspense>`:
```tsx
<Canvas>
  <Suspense fallback={<LoadingScreen />}>
    <SceneContent />
  </Suspense>
</Canvas>
```

## Event Handling
R3F provides `onClick`, `onPointerOver`, `onPointerOut` directly on mesh components:
```tsx
<mesh onClick={(e) => { e.stopPropagation(); onSelect(sculpture); }}>
```

## Camera Control
- v0.1 uses manual camera position/target animation (no OrbitControls for scene nav)
- OrbitControls are used ONLY in the info panel's sculpture detail view
- Use `useThree().camera` and lerp to animate between waypoints
```

### Skill 2: Gallery Config Schema

```
.agents/skills/gallery-config/
├── SKILL.md
└── references/
    └── example-gallery.yaml
```

**`.agents/skills/gallery-config/SKILL.md`:**
```markdown
---
name: gallery-config
description: The YAML config schema, validation rules, and defaults for gallery.yaml.
---

# Gallery Config Schema

When working with `gallery.yaml` or any config-related code, follow these rules:

## Required Fields
Only two fields are strictly required per sculpture: `file` (path to GLB) and `title`.
All other fields have defaults defined in `src/config/defaults.ts`.

## Validation Rules
- `file` must end in `.glb` or `.gltf`
- `file` must exist on disk relative to `gallery/`
- `template` must be a key in the template registry
- `theme.walls`, `theme.floor`, `theme.ambient` must be valid preset names
- `scale` must be a positive number
- Provide clear, human-readable error messages — the user is likely not a developer

## Path Resolution
All paths in the YAML are relative to the `gallery/` directory, NOT the project root.
The loader resolves them to absolute paths for Vite's asset handling.

## Example
See `references/example-gallery.yaml` for a fully annotated config file.
```

### Skill 3: glTF Optimization

```
.agents/skills/gltf-optimize/
├── SKILL.md
└── scripts/
    └── check-model-stats.sh
```

**`.agents/skills/gltf-optimize/SKILL.md`:**
```markdown
---
name: gltf-optimize
description: How to use glTF-Transform for mesh optimization in the asset pipeline.
---

# glTF Optimization

## Pipeline Order
Always apply transforms in this order:
1. `dedup()` — remove duplicate data
2. `prune()` — remove unused nodes
3. `simplify()` — reduce triangle count (only if over threshold)
4. `textureCompress()` — compress textures to WebP
5. `meshopt()` or `draco()` — compress geometry (pick one, not both)

## Key APIs
```typescript
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, simplify, textureCompress, meshopt } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read('input.glb');
await doc.transform(dedup(), prune(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.5 }));
const output = await io.writeBinary(doc);
```

## Check Model Stats
Run `scripts/check-model-stats.sh <file.glb>` to get triangle count, texture sizes, and file size before optimizing.

## Important
- Never overwrite source files. Write to `.cache/optimized/`
- Draco and meshopt are mutually exclusive compression methods
- `sharp` is required as a peer dependency for texture compression
- Museum photogrammetry scans routinely exceed 1M triangles — the simplify step is critical
```

### Skill 4: Template Layout Math

```
.agents/skills/template-layout/
└── SKILL.md
```

**`.agents/skills/template-layout/SKILL.md`:**
```markdown
---
name: template-layout
description: How room templates calculate sculpture placement and waypoint positions.
---

# Template Layout System

## Placement Algorithm (Long Hall)
The Long Hall template is a rectangular corridor. Sculptures alternate between left and right walls.

Given N sculptures:
- Hall length = N * SPACING + 2 * PADDING (where SPACING ≈ 4 meters, PADDING ≈ 3 meters)
- Hall width = 8 meters (fixed)
- Hall height = 4 meters (fixed)
- Sculpture i position:
  - x = (i % 2 === 0) ? -2.5 : 2.5  (left or right side)
  - y = pedestal height (depends on sculpture bounding box)
  - z = PADDING + i * SPACING / 2
- Sculpture rotation: faces center of hall

## Waypoint Generation
Each sculpture gets one waypoint:
- Position: center of hall (x=0), eye height (y=1.6), offset from sculpture (z = sculpture.z ± 1.5)
- LookAt: sculpture center point
- Additional waypoints at hall entrance and exit

## Pedestal Sizing
The pedestal auto-scales based on the sculpture's bounding box:
- Pedestal width/depth = max(sculpture.boundingBox.x, sculpture.boundingBox.z) * 1.2
- Pedestal height = 1.0 meter (fixed, can be overridden)
- Sculpture Y position = pedestal height + half sculpture height (so it sits on top)

## Units
All measurements are in meters. Three.js units map 1:1 to meters in this project.
```

---

## 3. Implementation Plan

This plan is structured as a sequence of tasks that can be dispatched to Antigravity agents. Each task is self-contained with clear inputs, outputs, and acceptance criteria. Tasks within the same phase can be parallelized.

### Phase 0: Project Scaffolding

**Task 0.1 — Initialize the Vite + React + TypeScript project**
- Run `npm create vite@latest . -- --template react-ts`
- Install dependencies: `three`, `@react-three/fiber`, `@react-three/drei`, `yaml`, `tailwindcss`
- Configure `vite.config.ts` with: base set to `"./"`, asset handling for GLB files, YAML raw import plugin
- Configure `tailwind.config.ts` to scan `src/**/*.tsx`
- Create the `gallery/` directory structure with a placeholder `gallery.yaml`
- **Acceptance:** `npm run dev` starts without errors, shows a blank page

**Task 0.2 — Create the config system**
- Implement `src/config/schema.ts` with TypeScript interfaces (see Architecture Guide §3.2)
- Implement `src/config/defaults.ts` with default values for all optional fields
- Implement `src/config/loader.ts`: reads YAML string, parses with `yaml`, validates, merges defaults, resolves paths
- Write unit tests for the loader (validation errors, default merging, path resolution)
- **Acceptance:** `loader.ts` correctly parses the example `gallery.yaml` and throws clear errors for invalid configs

**Task 0.3 — Set up the sample gallery**
- Download 2-3 CC0 sculpture GLBs from Smithsonian Open Access (si.edu) or Sketchfab
- Place them in `gallery/sculptures/`
- Write a complete `gallery/gallery.yaml` that references them
- **Acceptance:** Sample GLBs are under 20MB each and the YAML passes validation

### Phase 1: Core 3D Scene (parallelize 1.1 and 1.2)

**Task 1.1 — Build the room shell**
- Implement `src/gallery/RoomShell.tsx`: generates wall, floor, and ceiling geometry based on hall dimensions
- Implement theme material presets (marble-white, hardwood-dark, etc.) as Three.js materials
- Room dimensions are passed as props from the template
- **Acceptance:** A visible, lit room renders in the Canvas. Walls/floor/ceiling have distinct materials matching the theme.

**Task 1.2 — Build the sculpture loader**
- Implement `src/gallery/Sculpture.tsx`: uses `useGLTF` to load GLB, calculates bounding box, positions on pedestal
- Implement `src/gallery/Pedestal.tsx`: generates pedestal geometry sized to the sculpture's footprint
- Handle loading errors gracefully (show placeholder if GLB fails to load)
- **Acceptance:** A single sculpture loads, sits on a pedestal, and is lit by ambient light

**Task 1.3 — Build the Long Hall template**
- Implement `src/gallery/templates/LongHall.tsx` with the placement algorithm from the Template Layout skill
- Template receives `sculptures` config array, calculates positions, renders `<Sculpture>` instances
- Template also calculates and exports waypoint positions
- Implement `src/gallery/templates/index.ts` as the template registry
- **Acceptance:** Multiple sculptures render in a corridor, alternating left/right, with proper spacing

**Task 1.4 — Build the lighting system**
- Implement `src/gallery/GalleryLighting.tsx`: ambient light (based on theme), hemisphere light for natural fill
- Per-sculpture spotlights for sculptures with `spotlight: true`
- Single shadow-casting directional light
- **Acceptance:** Sculptures are well-lit with visible shadows. Spotlight sculptures have noticeable accent lighting.

### Phase 2: Navigation

**Task 2.1 — Build the waypoint system**
- Implement `src/navigation/WaypointNav.tsx`: renders clickable floor markers at waypoint positions
- Implement `src/navigation/Waypoint.tsx`: individual marker (subtle glowing dot on floor)
- Markers highlight on hover, show active state for current waypoint
- **Acceptance:** Floor markers are visible and clickable. Console logs the selected waypoint on click.

**Task 2.2 — Build the camera animator**
- Implement `src/navigation/CameraAnimator.tsx`: smoothly animates camera position and lookAt target
- Uses `useFrame` with damped lerp (or instant move if `reduced_motion` is true)
- Camera stays at eye height (y=1.6) during transitions
- **Acceptance:** Clicking a waypoint smoothly moves the camera to that position and angle

**Task 2.3 — Build keyboard and mobile navigation**
- Arrow keys cycle through waypoints in order (Left = previous, Right = next)
- Touch: tap floor markers (same as click). Swipe left/right cycles waypoints.
- Tab key cycles through waypoints with visible focus indicator
- ARIA live region announces waypoint label on navigation
- **Acceptance:** Full keyboard navigation works. VoiceOver/NVDA announces waypoint labels.

**Task 2.4 — Build the NavigationSystem controller**
- Implement `src/navigation/NavigationSystem.tsx`: top-level component that manages current waypoint state
- Sets initial waypoint to the hall entrance
- Coordinates between WaypointNav, CameraAnimator, and keyboard/touch inputs
- **Acceptance:** Complete navigation flow works end-to-end with all input methods

### Phase 3: UI Overlay

**Task 3.1 — Build the info panel**
- Implement `src/ui/InfoPanel.tsx`: slides in from the right when a sculpture is clicked
- Displays all metadata fields from the config (title, artist, date, medium, description)
- Close button, Escape key, and click-outside-to-close
- Transition animation (slide + fade)
- **Acceptance:** Clicking a sculpture opens a panel with correct metadata. Panel closes cleanly.

**Task 3.2 — Build the loading screen**
- Implement `src/ui/LoadingScreen.tsx`: full-screen overlay with gallery title and progress bar
- Progress bar tracks model loading (percentage of total bytes loaded)
- Fades out when all models are ready
- **Acceptance:** Loading screen appears on initial load, shows progress, and fades out smoothly

**Task 3.3 — Build the header and welcome modal**
- Implement `src/ui/GalleryHeader.tsx`: institution name and optional logo, semi-transparent bar at top
- Implement `src/ui/WelcomeModal.tsx`: first-visit overlay explaining controls (click markers to move, click sculptures for info)
- Welcome modal dismissed on click/tap, preference saved to localStorage
- **Acceptance:** Header shows institution info. Welcome modal appears once, then never again.

**Task 3.4 — Build the minimap**
- Implement `src/ui/Minimap.tsx`: small top-down schematic of the hall layout
- Shows sculpture positions as dots, current camera position as a highlighted marker
- Clicking a sculpture dot navigates to its waypoint
- Can be toggled on/off
- **Acceptance:** Minimap accurately represents the hall layout and responds to navigation

### Phase 4: Optimization and Polish

**Task 4.1 — Build the optimization script**
- Implement `scripts/optimize.ts` using glTF-Transform (see the gltf-optimize Skill)
- Reads `gallery.yaml`, processes each GLB, writes to `.cache/optimized/`
- Logs per-file stats (original size, optimized size, triangle count before/after)
- Add `"optimize": "npx tsx scripts/optimize.ts"` to package.json scripts
- **Acceptance:** Running `npm run optimize` processes sample GLBs and reports size reduction

**Task 4.2 — Configure the Vite build for production**
- Ensure GLB files are copied (not bundled) to `dist/`
- Configure code splitting: vendor chunk (Three.js + React), app chunk
- Set `base: "./"` for relative path compatibility
- Test that `dist/` works when served from a subdirectory
- **Acceptance:** `npm run build` produces a working `dist/` folder. `npx vite preview` serves it correctly.

**Task 4.3 — GitHub Pages deployment workflow**
- Create `.github/workflows/deploy.yml` that builds and deploys to GitHub Pages on push to `main`
- **Acceptance:** Pushing to main triggers a deployment and the gallery is accessible at the Pages URL

**Task 4.4 — Responsive and mobile testing**
- Use Antigravity's browser agent to test the gallery at viewport widths: 375px, 768px, 1024px, 1440px, 2560px
- Verify touch navigation works in mobile emulation
- Fix any layout issues in the UI overlay
- **Acceptance:** Gallery is usable at all tested viewports. No overlapping elements, no broken layouts.

**Task 4.5 — Write the README**
- Comprehensive README covering: project overview, screenshot/GIF, quick start (clone → configure → deploy), config reference, optimization guide, customization guide for developers, contributing guidelines, license
- The README is the most important file in the repo. It should be thorough enough that a museum staffer with basic command-line skills can go from zero to deployed gallery by following it.
- **Acceptance:** A person who has never seen this project can deploy the sample gallery within 30 minutes by following the README alone.

---

## 4. Leveraging Antigravity Features

### Multi-Agent Parallelism
Phases 1.1 and 1.2 have no code dependencies on each other and can be dispatched to separate agents simultaneously. Same for 3.1/3.2/3.3. Use the Agent Manager to run these in parallel workspaces.

### Browser Sub-Agent for Testing
After Phase 2, use Antigravity's browser agent to:
- Launch `npm run dev`
- Navigate to `localhost:5173`
- Click through all waypoints and verify camera movement
- Click each sculpture and verify info panel content
- Capture screenshots at each waypoint as Artifacts for review

This is especially valuable for Task 4.4 (responsive testing) — the browser agent can resize the viewport and screenshot at each breakpoint.

### Artifact-Based Review
For each Phase, the agent should produce an Artifact summarizing:
- What was implemented
- Screenshot(s) of the current state
- Known issues or deviations from the spec
- Suggested next steps

This creates a reviewable paper trail of the build process.

### Knowledge Base
As the project progresses, save these to Antigravity's knowledge base:
- The final resolved config schema (after any changes during implementation)
- The exact waypoint generation algorithm (tuned through iteration)
- Material preset definitions (colors, roughness, metalness values)
- Any Three.js gotchas discovered during implementation (e.g., texture color space issues)

### MCP Integrations
If you have GitHub MCP configured, the agent can:
- Create issues for each task
- Open PRs for each phase
- Run CI checks and report results as Artifacts

---

## 5. Testing Strategy

### Unit Tests
- Config loader: valid YAML, invalid YAML, missing required fields, path resolution
- Template placement algorithm: correct positions for 1, 5, 10, 20 sculptures
- Waypoint generation: correct camera positions and lookAt targets

### Visual Regression (via Antigravity's browser agent)
- Screenshot the gallery at each waypoint after each phase
- Compare screenshots across phases to catch regressions
- Capture at multiple viewport sizes

### Manual QA Checklist
- [ ] Gallery loads with sample sculptures
- [ ] Loading screen appears and fades out
- [ ] All sculptures visible and correctly placed on pedestals
- [ ] Clicking waypoint markers moves camera
- [ ] Arrow keys navigate between waypoints
- [ ] Clicking a sculpture opens info panel with correct data
- [ ] Info panel closes on Escape / outside click
- [ ] Minimap reflects current position
- [ ] Works on Chrome, Firefox, Safari
- [ ] Works on mobile (iOS Safari, Android Chrome)
- [ ] `npm run build` produces working static output
- [ ] Built site works served from a subdirectory (`/gallery/`)

---

## 6. Reference Materials

These should be bookmarked or added to the Antigravity knowledge base:

| Resource | URL |
|----------|-----|
| React Three Fiber docs | https://r3f.docs.pmnd.rs/ |
| Drei docs | https://drei.docs.pmnd.rs/ |
| Three.js docs | https://threejs.org/docs/ |
| glTF-Transform docs | https://gltf-transform.dev/ |
| Smithsonian 3D Open Access | https://3d.si.edu/ |
| Smithsonian Voyager (reference) | https://smithsonian.github.io/dpo-voyager/ |
| Vite docs | https://vite.dev/guide/ |
| Tailwind CSS docs | https://tailwindcss.com/docs |

---

## 7. Post-v0.1 Roadmap Context

For context on where this project is heading (do not implement in v0.1, but design with these in mind):

- **v0.2:** Free-roam WASD navigation with `@react-three/rapier` collision, 2 additional room templates
- **v0.3:** Audio guide support (per-sculpture MP3/OGG files), multilingual labels
- **v0.4:** WebXR/VR support via R3F's XR bindings, VR teleport locomotion
- **v1.0:** Stable release with full documentation, published to npm as a template

Design decisions in v0.1 should not preclude any of these additions. In particular:
- The navigation system should be modular enough to swap in free-roam alongside waypoints
- The template system should be extensible without modifying core code
- The config schema should be forward-compatible (new fields can be added without breaking existing configs)
