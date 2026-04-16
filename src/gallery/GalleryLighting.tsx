import type { AmbientTheme, SculptureConfig } from '../config/schema';

export interface PlacedSculpture {
  config: SculptureConfig;
  position: [number, number, number];
}

interface GalleryLightingProps {
  themePreset: AmbientTheme;
  sculptures: PlacedSculpture[];
  hallLength: number;
}

const AMBIENT_PRESETS = {
  warm: { color: "#fff5e6", intensity: 0.4, sky: "#fffaf0" },
  cool: { color: "#e6f0ff", intensity: 0.4, sky: "#f0f5ff" },
  neutral: { color: "#ffffff", intensity: 0.35, sky: "#ffffff" },
  dramatic: { color: "#fff0d4", intensity: 0.2, sky: "#ffffeb" },
};

export function GalleryLighting({ themePreset, sculptures, hallLength }: GalleryLightingProps) {
  const preset = AMBIENT_PRESETS[themePreset] || AMBIENT_PRESETS.neutral;

  return (
    <>
      <ambientLight color={preset.color} intensity={preset.intensity} />
      
      <hemisphereLight 
        color={preset.sky} 
        groundColor="#404040" 
        intensity={0.3} 
      />

      <directionalLight
        position={[5, 8, 5]}
        intensity={0.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
      >
        <object3D attach="target" position={[0, 0, hallLength / 2]} />
        <orthographicCamera
          attach="shadow-camera"
          left={-15}
          right={15}
          top={hallLength}
          bottom={-10}
          near={0.1}
          far={hallLength + 30}
        />
      </directionalLight>

      {sculptures.map((s, i) => {
        if (!s.config.spotlight) return null;
        
        const [x, y, z] = s.position;
        // Position: above and slightly in front (offset y+3, offset toward center of hall)
        const lightX = x > 0 ? x - 1.5 : x + 1.5;
        const spotPos: [number, number, number] = [lightX, y + 3, z];
        
        return (
          <spotLight
            key={`spotlight-${i}`}
            position={spotPos}
            intensity={0.8}
            angle={0.4}
            penumbra={0.5}
            color="#fff8f0"
            castShadow
          >
            <object3D attach="target" position={[x, y + 1, z]} />
          </spotLight>
        );
      })}
    </>
  );
}
