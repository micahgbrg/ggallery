import { useEffect, useState } from 'react';
import type { WaypointDef } from '../gallery/templates';

interface ARIAAnnouncementsProps {
  currentWaypoint: WaypointDef | null;
}

export function ARIAAnnouncements({ currentWaypoint }: ARIAAnnouncementsProps) {
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (currentWaypoint) {
      if (currentWaypoint.id === 'entrance') {
        setAnnouncement('Gallery entrance');
      } else if (currentWaypoint.id === 'exit') {
        setAnnouncement('Gallery exit');
      } else {
        setAnnouncement(`Now viewing: ${currentWaypoint.label || currentWaypoint.id}`);
      }
    }
  }, [currentWaypoint]);

  return <div aria-live="polite" className="sr-only">{announcement}</div>;
}
