import type { WaypointDef } from '../gallery/templates';
import { Waypoint } from './Waypoint';

interface WaypointNavProps {
  waypoints: WaypointDef[];
  currentWaypointId: string;
  onNavigate: (waypoint: WaypointDef) => void;
}

export function WaypointNav({ waypoints, currentWaypointId, onNavigate }: WaypointNavProps) {
  return (
    <group>
      {waypoints.map(wp => (
        <Waypoint
          key={wp.id}
          id={wp.id}
          position={wp.position}
          isActive={wp.id === currentWaypointId}
          onClick={() => onNavigate(wp)}
        />
      ))}
    </group>
  );
}
