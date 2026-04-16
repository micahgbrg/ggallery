# Architecture Guide: Museum Virtual Sculpture Gallery

**Version:** 0.1  
**Last Updated:** April 16, 2026

---

## 1. System Overview

The project is a Vite + React + TypeScript template repository. It is not a library, not a CLI tool, and not a SaaS platform. It is a clonable, configurable web application that reads a YAML config and a folder of 3D assets, then renders a navigable virtual sculpture gallery.

```
┌─────────────────────────────────────────────────────────┐
│                    Build Time                            │
│                                                         │
│  gallery.yaml ──→ Config Loader ──→ Validated Config    │
│  gallery/sculptures/*.glb ──→ (optional) glTF-Transform │
│                                        ↓                │
│                                   Vite Build             │
│                                        ↓                │
│                                   dist/ (static)         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Runtime (Browser)                      │
│                                                         │
│  index.html loads main.tsx                               │
│       ↓                                                  │
│  App.tsx reads embedded config JSON                      │
│       ↓                                                  │
│  GalleryScene.tsx selects room template                  │
│       ↓                                                  │
│  Template places Sculpture components                    │
│       ↓                                                  │
│  NavigationSystem manages camera + waypoints             │
│  InfoPanel renders HTML overlay on sculpture click       │
└─────────────────────────────────────────────────────────┘
```

## 2. Repository Structure

```
museum-gallery/
├── gallery/                        # USER CONTENT (the only folder basic users touch)
│   ├── gallery.yaml                # Gallery configuration
│   ├── sculptures/                 # GLB/glTF model files
│   └── media/                      # Images, logos, audio (future)
│
├── src/                            # APPLICATION SOURCE
│   ├── main.tsx                    # React entry point
│   ├── App.tsx                     # Root component — loads config, renders scene
│   │
│   ├── config/                     # Configuration layer
│   │   ├── schema.ts              # TypeScript interfaces for gallery.yaml
│   │   ├── loader.ts              # YAML parsing, validation, path resolution
│   │   └── defaults.ts            # Default values for optional config fields
│   │
│   ├── gallery/                    # 3D scene components
│   │   ├── GalleryScene.tsx       # Top-level R3F Canvas + scene setup
│   │   ├── templates/             # Room layout components
│   │   │   ├── index.ts           # Template registry (name → component mapping)
│   │   │   └── LongHall.tsx       # v0.1 template: linear corridor layout
│   │   ├── Sculpture.tsx          # Loads GLB, wraps in pedestal, handles interaction
│   │   ├── Pedestal.tsx           # Configurable pedestal geometry + material
│   │   ├── RoomShell.tsx          # Walls, floor, ceiling geometry
│   │   └── GalleryLighting.tsx    # Ambient + per-sculpture spotlights
│   │
│   ├── navigation/                 # Camera and movement system
│   │   ├── NavigationSystem.tsx   # Top-level nav controller, mode switching
│   │   ├── WaypointNav.tsx        # Click-to-teleport between viewpoints
│   │   ├── Waypoint.tsx           # Individual waypoint marker (floor dot)
│   │   └── CameraAnimator.tsx     # Smooth camera transitions between waypoints
│   │
│   ├── ui/                         # 2D HTML overlay components
│   │   ├── InfoPanel.tsx          # Sculpture detail panel (title, artist, etc.)
│   │   ├── Minimap.tsx            # Top-down navigation overview
│   │   ├── LoadingScreen.tsx      # Branded loading with progress bar
│   │   ├── WelcomeModal.tsx       # First-visit instructions
│   │   └── GalleryHeader.tsx      # Institution name/logo bar
│   │
│   └── utils/
│       ├── responsive.ts          # Viewport detection, quality tier selection
│       └── accessibility.ts       # Keyboard nav helpers, ARIA announcements
│
├── scripts/
│   └── optimize.ts                 # Pre-build asset optimization via glTF-Transform
│
├── public/                         # Static assets (favicon, og-image)
├── index.html                      # HTML entry point
├── vite.config.ts                  # Vite configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml             # GitHub Pages deployment workflow
└── README.md
```

## 3. Data Flow

### 3.1 Config Loading

```
gallery.yaml
     │
     ▼
loader.ts (YAML parse → validate → resolve paths → merge defaults)
     │
     ▼
GalleryConfig (TypeScript object, fully typed)
     │
     ▼
Passed as props through React component tree
```

At build time, Vite's `import` resolves `gallery.yaml` as a raw string (via a Vite plugin or raw import). The `loader.ts` module parses it with the `yaml` npm package, validates it against the schema, resolves relative file paths, and merges in defaults from `defaults.ts`.

The resulting `GalleryConfig` object is the single source of truth for the entire application. It flows down through React props — no global state management library needed for v0.1.

### 3.2 Config Schema (TypeScript)

```typescript
// src/config/schema.ts

export interface GalleryConfig {
  gallery: {
    title: string;
    institution?: string;
    description?: string;
    logo?: string;              // path relative to gallery/
  };
  template: TemplateName;       // "long-hall" | "open-atrium" | "small-room"
  theme: {
    walls: ThemePreset;         // "marble-white" | "concrete" | "plaster-warm" | ...
    floor: ThemePreset;         // "hardwood-dark" | "marble-grey" | "concrete" | ...
    ambient: AmbientPreset;     // "warm" | "cool" | "neutral" | "dramatic"
  };
  sculptures: SculptureConfig[];
  navigation: {
    mode: "waypoint";           // v0.1 only supports waypoint
    show_minimap: boolean;
  };
  accessibility: {
    keyboard_navigation: boolean;
    screen_reader_labels: boolean;
    reduced_motion: boolean;
  };
}

export interface SculptureConfig {
  file: string;                 // required — path to GLB/glTF relative to gallery/
  title: string;                // required
  artist?: string;
  date?: string;
  medium?: string;
  description?: string;
  image?: string;               // optional placard image
  spotlight?: boolean;          // default: false
  scale?: number;               // default: 1.0
}
```

### 3.3 Model Loading

Sculptures are loaded using Drei's `useGLTF` hook inside a React `<Suspense>` boundary. The loading flow is:

1. `GalleryScene` renders `<Suspense fallback={<LoadingScreen />}>`
2. Inside Suspense, the template component renders `<Sculpture>` for each entry in `config.sculptures`
3. Each `<Sculpture>` calls `useGLTF(sculptureConfig.file)` which triggers async loading
4. React Suspense holds the fallback until all models resolve
5. Once all models load, the scene renders and the loading screen fades out

`useGLTF` automatically caches loaded models and supports Draco decompression if the GLB uses it.

### 3.4 Asset Optimization Pipeline

The `scripts/optimize.ts` script is a Node.js program that runs outside the browser. It:

1. Reads `gallery/gallery.yaml` to find all referenced GLB files
2. For each file, runs a glTF-Transform pipeline:
   - `prune()` — remove unused nodes/textures
   - `dedup()` — deduplicate identical vertex/texture data
   - `simplify()` — reduce triangle count if over threshold (configurable, default 100K)
   - `textureCompress({ targetFormat: 'webp' })` — compress textures
   - `meshopt()` — apply meshopt compression
3. Writes optimized files to `.cache/optimized/` preserving directory structure
4. Reports size savings per file

This uses `@gltf-transform/core`, `@gltf-transform/functions`, and `@gltf-transform/extensions` as Node.js dependencies (not bundled in the browser output).

## 4. Component Architecture

### 4.1 Scene Graph (R3F)

```
<Canvas>
  <Suspense fallback={<LoadingScreen />}>
    <GalleryScene config={config}>
      <GalleryLighting ambient={config.theme.ambient} sculptures={config.sculptures} />
      <RoomShell template={config.template} theme={config.theme} />
      <LongHall sculptures={config.sculptures}>
        <Sculpture config={sculptures[0]} position={[...]} />
        <Sculpture config={sculptures[1]} position={[...]} />
        ...
      </LongHall>
      <NavigationSystem mode={config.navigation.mode}>
        <WaypointNav waypoints={generatedWaypoints} />
      </NavigationSystem>
    </GalleryScene>
  </Suspense>
</Canvas>
```

### 4.2 Template System

Templates are React components that receive a `sculptures` array and are responsible for:

1. Determining the room dimensions based on sculpture count
2. Calculating sculpture placement positions (x, y, z coordinates + rotation)
3. Generating waypoint positions that provide good viewing angles
4. Passing placement data down to `<Sculpture>` and `<WaypointNav>` children

Each template exports a component and a metadata object:

```typescript
// src/gallery/templates/LongHall.tsx

export const metadata: TemplateMetadata = {
  name: "long-hall",
  displayName: "Long Hall",
  description: "A linear corridor with sculptures on alternating sides",
  minSculptures: 1,
  maxSculptures: 20,
};

export default function LongHall({ sculptures, theme, children }: TemplateProps) {
  const placements = calculatePlacements(sculptures);
  const waypoints = generateWaypoints(placements);
  // ... renders room geometry + sculpture instances
}
```

The template registry (`src/gallery/templates/index.ts`) maps template names from the YAML config to their components:

```typescript
export const templates: Record<TemplateName, React.LazyExoticComponent<...>> = {
  "long-hall": lazy(() => import("./LongHall")),
  "open-atrium": lazy(() => import("./OpenAtrium")),   // v0.2
  "small-room": lazy(() => import("./SmallRoom")),     // v0.2
};
```

### 4.3 Navigation System

The navigation system is the most complex subsystem. For v0.1 (waypoint mode only):

**Waypoint generation:** Each template generates an array of `WaypointDef` objects:

```typescript
interface WaypointDef {
  id: string;
  position: [number, number, number];   // camera position
  lookAt: [number, number, number];     // camera target
  label: string;                         // for accessibility + minimap
  sculptureIndex?: number;               // which sculpture this waypoint faces
}
```

**Camera animation:** When the user selects a waypoint, `CameraAnimator` smoothly interpolates the camera from its current position/target to the new waypoint's position/target using a damped lerp (or instant teleport if `reduced_motion` is enabled).

**Input handling:**
- Desktop: Click floor markers, or use Left/Right arrow keys to cycle waypoints
- Mobile: Tap floor markers, or swipe left/right
- Keyboard: Arrow keys, Tab to cycle, Enter to select
- Screen reader: Waypoint labels are announced via ARIA live regions

### 4.4 UI Overlay

HTML overlay elements are rendered outside the R3F Canvas using standard React + Tailwind. They sit in a layer on top of the 3D scene:

```
┌──────────────────────────────────────────────┐
│ [Logo] Ancient Mediterranean Sculpture       │  ← GalleryHeader
│──────────────────────────────────────────────│
│                                              │
│              3D Scene (Canvas)               │
│                                              │
│                          ┌──────────────┐    │
│                          │  The Thinker  │   │  ← InfoPanel
│                          │  Rodin, 1904  │   │
│                          │  Bronze       │   │
│                          │  ...          │   │
│                          └──────────────┘    │
│                                              │
│  [·] [·] [●] [·] [·]                        │  ← Minimap/waypoints
└──────────────────────────────────────────────┘
```

The info panel opens when a sculpture is clicked (raycasting via R3F's `onClick` event). It closes on outside click or Escape.

## 5. Key Technical Decisions

### 5.1 Why R3F Over Vanilla Three.js
- Drei provides `useGLTF`, `Html`, `OrbitControls`, `Environment` — saves weeks of manual implementation
- React Suspense handles progressive loading naturally
- Component model makes templates composable and testable
- Larger contributor pool (React devs outnumber vanilla Three.js devs)
- The bundle size penalty (~150KB gzipped for React+ReactDOM) is acceptable given the developer experience gains

### 5.2 Why Waypoint Navigation as Default
- Museum visitors are not gamers; WASD + pointer lock is disorienting for the target audience
- Waypoints guarantee good camera angles — every visitor sees each sculpture from its best side
- Waypoints are fully accessible via keyboard and screen readers
- No physics engine needed (no collision detection), reducing bundle size and complexity
- Free-roam can be added in v0.2 as an opt-in mode using `@react-three/rapier`

### 5.3 Why YAML Over JSON for Config
- YAML supports comments (JSON does not) — critical for a config file that non-developers edit
- YAML's multi-line strings (`>` and `|`) handle long descriptions cleanly
- More readable for non-technical users
- The `yaml` npm package has zero dependencies

### 5.4 Why a Template Repo Instead of a CLI/Generator
- Zero abstraction layer — the code is right there, readable and modifiable
- Contributors can add features by editing React components, not learning a plugin API
- Museums' web contractors can customize anything without hitting framework limitations
- Git-native: fork it, customize it, pull upstream updates when new templates ship

### 5.5 Why glTF-Transform Over gltfpack for Optimization
- glTF-Transform has a composable Node.js API — the optimization script can be customized programmatically
- It supports the full range of operations: simplification, Draco, meshopt, texture compression, dedup, prune
- It is actively maintained by Don McCurdy (the same developer behind `three-pathfinding` and `glTF-Transform`)
- gltfpack is more aggressive but less configurable; it can be offered as an alternative in documentation

## 6. Performance Strategy

### 6.1 Loading
- Sculptures load in parallel via React Suspense
- A progress bar in the loading screen tracks individual model load progress
- Textures are compressed to WebP during the optimize step
- Draco/meshopt decompression runs on a Web Worker (handled by Three.js's loader)

### 6.2 Rendering
- Only the visible portion of the gallery renders at full quality (frustum culling is built into Three.js)
- Sculptures far from the camera use lower LOD if multiple derivatives were generated during optimization
- Lighting uses baked ambient occlusion where possible, with a single directional shadow-casting light
- `frameloop="demand"` on the R3F Canvas — the scene only re-renders when something changes (camera moves, interaction), not 60fps continuously

### 6.3 Mobile
- Quality tier detection based on `navigator.hardwareConcurrency` and `renderer.capabilities`
- Lower-tier devices get: reduced shadow map resolution, no SSAO, simplified environment maps
- Touch controls use tap-to-teleport (same waypoint system, touch-friendly hit areas)

## 7. Dependency Map

### Runtime (shipped in browser bundle)
```
react                   ^18.3.0      Core framework
react-dom               ^18.3.0      DOM renderer
three                   ^0.170.0     3D engine
@react-three/fiber      ^8.17.0      React renderer for Three.js
@react-three/drei       ^9.115.0     Utility components (useGLTF, Html, etc.)
yaml                    ^2.6.0       YAML parser (zero deps)
```

### Build-time only (not in browser bundle)
```
vite                    ^6.0.0       Build tool
typescript              ^5.6.0       Type checking
tailwindcss             ^4.0.0       CSS utility framework
@gltf-transform/core    ^4.0.0       glTF SDK (for optimize script)
@gltf-transform/functions ^4.0.0     glTF operations
@gltf-transform/extensions ^4.0.0    glTF extension support
meshoptimizer           ^0.22.0      Mesh simplification WASM
sharp                   ^0.33.0      Image processing (texture compression)
draco3dgltf             ^1.5.0       Draco compression codec
```

### Future (v0.2+, not installed in v0.1)
```
@react-three/rapier     ^1.5.0       Physics/collision for free-roam mode
three-pathfinding       ^1.3.0       Navigation mesh for constrained movement
```

## 8. Deployment Architecture

The output of `npm run build` is a `dist/` folder containing:

```
dist/
├── index.html                    # Entry point
├── assets/
│   ├── index-[hash].js          # Application bundle (~250KB gzipped)
│   ├── index-[hash].css         # Tailwind styles (~10KB gzipped)
│   ├── vendor-[hash].js         # Three.js + React (~200KB gzipped)
│   └── draco/                   # Draco WASM decoder (loaded on demand)
├── sculptures/                   # GLB files (copied from gallery/)
│   ├── venus-de-milo.glb
│   └── the-thinker.glb
└── media/                        # Images/logos (copied from gallery/)
```

This folder can be uploaded to any static file server. No server-side runtime, no database, no API.
