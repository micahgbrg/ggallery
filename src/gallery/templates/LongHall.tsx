import { useMemo } from 'react';
import { RoomShell } from '../RoomShell';
import { Sculpture } from '../Sculpture';
import type { TemplateMetadata, TemplateProps, WaypointDef } from './index';
import type { SculptureConfig } from '../../config/schema';

import { GalleryLighting, type PlacedSculpture } from '../GalleryLighting';

export const metadata: TemplateMetadata = {
  name: "long-hall",
  displayName: "Long Hall",
  description: "A classic gallery corridor where sculptures alternate left and right along the walls.",
  minSculptures: 1,
  maxSculptures: 50
};

export function generateWaypoints(sculptures: SculptureConfig[]): WaypointDef[] {
  const SPACING = 4;
  const PADDING = 3;
  const Z_STEP = SPACING / 2;
  const length = sculptures.length * Z_STEP + 2 * PADDING;
  const w: WaypointDef[] = [];
  
  w.push({
    id: "entrance",
    position: [0, 1.6, 1],
    lookAt: [0, 1.6, PADDING],
    label: "Entrance"
  });

  sculptures.forEach((sculpture, i) => {
    const isRight = i % 2 !== 0;
    const x = isRight ? 2.5 : -2.5;
    const z = PADDING + i * Z_STEP;
    
    w.push({
      id: `sculpture-${i}`,
      position: [0, 1.6, z],
      lookAt: [x, 1.2, z],
      label: sculpture.title,
      sculptureIndex: i
    });
  });

  w.push({
    id: "exit",
    position: [0, 1.6, length - 1],
    lookAt: [0, 1.6, length - 2],
    label: "Exit"
  });

  return w;
}

export default function LongHall({ sculptures, theme, onSelect }: TemplateProps) {
  const SPACING = 4;
  const PADDING = 3;
  const Z_STEP = SPACING / 2;
  const WIDTH = 8;
  const HEIGHT = 4;
  
  const length = sculptures.length * Z_STEP + 2 * PADDING;

  const placements = useMemo<PlacedSculpture[]>(() => {
    return sculptures.map((config, i) => {
      const isRight = i % 2 !== 0;
      const x = isRight ? 2.5 : -2.5;
      const z = PADDING + i * Z_STEP;
      return { config, position: [x, 0, z] };
    });
  }, [sculptures]);

  return (
    <group>
      <RoomShell width={WIDTH} height={HEIGHT} length={length} theme={theme} />
      <GalleryLighting themePreset={theme.ambient} sculptures={placements} hallLength={length} />
      {placements.map((sculpture, i) => (
        <group key={i} position={sculpture.position} rotation={[0, sculpture.position[0] > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
          <Sculpture
            config={sculpture.config}
            position={[0, 0, 0]}
            onSelect={onSelect || (() => {})}
          />
        </group>
      ))}
    </group>
  );
}
