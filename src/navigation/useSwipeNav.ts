import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import type { WaypointDef } from '../gallery/templates';

interface UseSwipeNavParams {
  waypoints: WaypointDef[];
  currentWaypointId: string;
  onNavigate: (waypoint: WaypointDef) => void;
  disabled?: boolean;
}

export function useSwipeNav({ waypoints, currentWaypointId, onNavigate, disabled = false }: UseSwipeNavParams) {
  const { gl } = useThree();
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas || disabled || waypoints.length === 0) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.changedTouches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const diffX = touchStartX.current - touchEndX;
      
      if (Math.abs(diffX) > 50) {
        const currentIndex = waypoints.findIndex((w) => w.id === currentWaypointId);
        
        if (diffX < 0) {
          // Swipe right -> Next
          if (currentIndex >= 0 && currentIndex < waypoints.length - 1) {
            onNavigate(waypoints[currentIndex + 1]);
          }
        } else {
          // Swipe left -> Previous
          if (currentIndex > 0) {
            onNavigate(waypoints[currentIndex - 1]);
          }
        }
      }
      touchStartX.current = null;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gl, waypoints, currentWaypointId, onNavigate, disabled]);
}
