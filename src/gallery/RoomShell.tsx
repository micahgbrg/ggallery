import type { GalleryTheme } from '../config/schema';

interface RoomShellProps {
  width: number;
  height: number;
  length: number;
  theme: GalleryTheme;
}

const MATERIALS = {
  "marble-white": { color: "#f5f0eb", roughness: 0.3, metalness: 0.0 },
  "concrete": { color: "#b0a89a", roughness: 0.8, metalness: 0.0 },
  "plaster-warm": { color: "#e8ddd0", roughness: 0.6, metalness: 0.0 },
  "hardwood-dark": { color: "#3d2b1f", roughness: 0.7, metalness: 0.0 },
  "marble-grey": { color: "#c4c0ba", roughness: 0.3, metalness: 0.05 },
};

export function RoomShell({ width, height, length, theme }: RoomShellProps) {
  const wallMaterialProps = MATERIALS[theme.walls];
  const floorMaterialProps = MATERIALS[theme.floor];

  return (
    <group>
      {/* Floor */}
      <mesh
        receiveShadow
        position={[0, 0, length / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial {...floorMaterialProps} />
      </mesh>

      {/* Ceiling */}
      <mesh
        position={[0, height, length / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial {...wallMaterialProps} />
      </mesh>

      {/* Left Wall (x = -width/2) */}
      <mesh
        position={[-width / 2, height / 2, length / 2]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial {...wallMaterialProps} />
      </mesh>

      {/* Right Wall (x = width/2) */}
      <mesh
        position={[width / 2, height / 2, length / 2]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial {...wallMaterialProps} />
      </mesh>

      {/* Back Wall (z = 0) */}
      <mesh
        position={[0, height / 2, 0]}
        rotation={[0, 0, 0]}
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial {...wallMaterialProps} />
      </mesh>

      {/* Front Wall (z = length) */}
      <mesh
        position={[0, height / 2, length]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial {...wallMaterialProps} />
      </mesh>
    </group>
  );
}
