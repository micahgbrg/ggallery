export interface PedestalProps {
  width: number;
  depth: number;
  height: number;
}

export function Pedestal({ width, depth, height }: PedestalProps) {
  const lipThickness = 0.02; // 2cm
  const lipOverhang = 0.04;  // slightly wider than the base

  const baseHeight = height - lipThickness;

  return (
    <group>
      {/* Base */}
      <mesh position={[0, baseHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, baseHeight, depth]} />
        <meshStandardMaterial color="#e8e0d8" roughness={0.4} metalness={0.05} />
      </mesh>

      {/* Top Lip */}
      <mesh position={[0, height - lipThickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + lipOverhang, lipThickness, depth + lipOverhang]} />
        <meshStandardMaterial color="#e8e0d8" roughness={0.4} metalness={0.05} />
      </mesh>
    </group>
  );
}
