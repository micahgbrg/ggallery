import { useEffect } from 'react';
import type { WaypointDef } from '../gallery/templates';

interface UseKeyboardNavParams {
  waypoints: WaypointDef[];
  currentWaypointId: string;
  onNavigate: (waypoint: WaypointDef) => void;
  disabled?: boolean;
}

export function useKeyboardNav({ waypoints, currentWaypointId, onNavigate, disabled = false }: UseKeyboardNavParams) {
  useEffect(() => {
    if (disabled || waypoints.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = waypoints.findIndex((w) => w.id === currentWaypointId);
      
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
        case 'd':
        case 'D':
        case 'w':
        case 'W':
          if (currentIndex >= 0 && currentIndex < waypoints.length - 1) {
            onNavigate(waypoints[currentIndex + 1]);
          }
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
        case 'a':
        case 'A':
        case 's':
        case 'S':
          if (currentIndex > 0) {
            onNavigate(waypoints[currentIndex - 1]);
          }
          break;
        case 'Home':
          onNavigate(waypoints[0]);
          break;
        case 'End':
          onNavigate(waypoints[waypoints.length - 1]);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [waypoints, currentWaypointId, onNavigate, disabled]);
}
