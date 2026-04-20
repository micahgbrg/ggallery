import { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useKeyboardNav } from './useKeyboardNav';
import { useSwipeNav } from './useSwipeNav';
import { WaypointNav } from './WaypointNav';
import { CameraAnimator } from './CameraAnimator';
import type { WaypointDef } from '../gallery/templates';

export interface NavigationApi {
  navigate: (waypointId: string) => void;
}

interface NavigationSystemProps {
  waypoints: WaypointDef[];
  reducedMotion?: boolean;
  disabled?: boolean;
  onWaypointChange?: (waypoint: WaypointDef) => void;
}

export const NavigationSystem = forwardRef<NavigationApi, NavigationSystemProps>(({
  waypoints,
  reducedMotion: _reducedMotion = false,
  disabled = false,
  onWaypointChange
}, ref) => {
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);

  const navigateToId = useCallback((id: string) => {
    if (disabled) return;
    const index = waypoints.findIndex(w => w.id === id);
    if (index !== -1) {
      setCurrentWaypointIndex(index);
    }
  }, [waypoints, disabled]);

  useImperativeHandle(ref, () => ({
    navigate: navigateToId
  }), [navigateToId]);

  const navigate = useCallback((waypoint: WaypointDef) => {
    navigateToId(waypoint.id);
  }, [navigateToId]);

  const currentWaypoint = waypoints[currentWaypointIndex];
  const currentWaypointId = currentWaypoint?.id || '';

  useEffect(() => {
    if (currentWaypoint && onWaypointChange) {
      onWaypointChange(currentWaypoint);
    }
  }, [currentWaypoint, onWaypointChange]);

  useKeyboardNav({
    waypoints,
    currentWaypointId,
    onNavigate: navigate,
    disabled
  });

  useSwipeNav({
    waypoints,
    currentWaypointId,
    onNavigate: navigate,
    disabled
  });

  if (!currentWaypoint) return null;

  return (
    <group>
      <WaypointNav 
        waypoints={waypoints} 
        currentWaypointId={currentWaypointId} 
        onNavigate={navigate} 
      />
      <CameraAnimator 
        targetPosition={currentWaypoint.position} 
        targetLookAt={currentWaypoint.lookAt} 
        // reducedMotion could be passed to CameraAnimator if it supports it
      />
    </group>
  );
});
