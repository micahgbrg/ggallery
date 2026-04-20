import { useState } from 'react';
import { useCursor } from '@react-three/drei';

interface WaypointProps {
  id: string;
  position: [number, number, number];
  isActive: boolean;
  onClick: (id: string) => void;
}

export function Waypoint({ id, position, isActive, onClick }: WaypointProps) {
  const [hovered, setHover] = useState(false);
  useCursor(hovered, 'pointer', 'auto');

  const scale = hovered ? 1.2 : 1.0;
  // Offset Y to be slightly above the floor
  const pos: [number, number, number] = [position[0], 0.01, position[2]];

  let color = '#ffffff';
  let opacity = 0.3;

  if (isActive) {
    color = '#4a9eff';
    opacity = 0.8;
  } else if (hovered) {
    opacity = 0.6;
  }

  return (
    <mesh
      position={pos}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={scale}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
      onPointerOut={() => { setHover(false); }}
      onClick={(e) => { e.stopPropagation(); onClick(id); }}
    >
      <circleGeometry args={[0.3, 32]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={opacity} 
        depthWrite={false}
      />
    </mesh>
  );
}
