import { useState, useEffect } from 'react';
import type { WaypointDef } from '../gallery/templates';
import type { SculptureConfig } from '../config/schema';
import { Map, ChevronUp, ChevronDown } from 'lucide-react';

interface MinimapProps {
  waypoints: WaypointDef[];
  sculptures: SculptureConfig[];
  currentWaypointId: string;
  hallDimensions: { width: number; length: number };
  onNavigate: (waypointId: string) => void;
  visible: boolean;
}

export function Minimap({
  waypoints,
  currentWaypointId,
  hallDimensions,
  onNavigate,
  visible
}: MinimapProps) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // Hidden by default on mobile, open by default on desktop
    const handleResize = () => {
      setIsOpen(window.innerWidth >= 768);
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!visible) return null;

  const MAP_WIDTH = 160;
  // Compute height maintaining aspect ratio
  const MAP_HEIGHT = (hallDimensions.length / hallDimensions.width) * MAP_WIDTH;

  const getMapCoords = (x: number, z: number) => {
    // Map x from [-width/2, width/2] to [MAP_WIDTH, 0] (flipped to match 3D room orientation)
    const mapX = (-x / hallDimensions.width + 0.5) * MAP_WIDTH;
    // Map z from [0, length] to [MAP_HEIGHT, 0] (z=0 is bottom)
    const mapY = ((hallDimensions.length - z) / hallDimensions.length) * MAP_HEIGHT;
    return { x: mapX, y: mapY };
  };

  const getRotationAngle = (dx: number, dz: number) => {
    return (Math.atan2(-dx, dz) * 180) / Math.PI;
  };

  const activeWaypoint = waypoints.find(w => w.id === currentWaypointId);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 items-start shrink-0 pointer-events-none">
      {isOpen && (
        <div
          className="bg-black/50 backdrop-blur rounded overflow-hidden border border-white/20 shadow-lg pointer-events-auto"
          style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
        >
          <svg width={MAP_WIDTH} height={MAP_HEIGHT} className="block">
            {/* Hall Outline */}
            <rect
              x={0}
              y={0}
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              fill="transparent"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
            />

            {/* Sculptures */}
            {waypoints.map((waypoint) => {
              if (waypoint.sculptureIndex === undefined) return null;
              // Sculpture position is exactly at its lookAt target for x and z
              const { x, y } = getMapCoords(waypoint.lookAt[0], waypoint.lookAt[2]);
              return (
                <rect
                  key={`sculpture-${waypoint.id}`}
                  x={x - 6}
                  y={y - 6}
                  width={12}
                  height={12}
                  fill="rgba(255, 255, 255, 0.2)"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-colors hover:fill-white/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(waypoint.id);
                  }}
                  role="button"
                  aria-label={`Navigate to ${waypoint.label}`}
                />
              );
            })}

            {/* Waypoint Dots */}
            {waypoints.map((waypoint) => {
              const { x, y } = getMapCoords(waypoint.position[0], waypoint.position[2]);
              const isActive = waypoint.id === currentWaypointId;

              return (
                <g key={`waypoint-${waypoint.id}`}>
                  {/* Clickable area */}
                  <circle
                    cx={x}
                    cy={y}
                    r={12}
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(waypoint.id);
                    }}
                  />
                  {/* Visible dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isActive ? 4 : 3}
                    fill={isActive ? '#4a9eff' : 'rgba(255, 255, 255, 0.6)'}
                    className="pointer-events-none transition-colors"
                  />
                </g>
              );
            })}

            {/* Camera Direction Arrow */}
            {activeWaypoint && (
              <g
                transform={`translate(${getMapCoords(activeWaypoint.position[0], activeWaypoint.position[2]).x}, ${getMapCoords(activeWaypoint.position[0], activeWaypoint.position[2]).y}) rotate(${getRotationAngle(activeWaypoint.lookAt[0] - activeWaypoint.position[0], activeWaypoint.lookAt[2] - activeWaypoint.position[2])})`}
                className="pointer-events-none transition-transform duration-500 ease-in-out"
              >
                <polygon
                  points="-4,4 0,-6 4,4"
                  fill="#4a9eff"
                  transform="translate(0, -6)" // Shift arrow slightly forward so it pivots near the dot
                />
              </g>
            )}
          </svg>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black/50 hover:bg-black/70 backdrop-blur border border-white/20 text-white rounded-full p-2 flex items-center justify-center shadow-lg transition-colors pointer-events-auto"
        aria-label={isOpen ? "Hide minimap" : "Show minimap"}
      >
        <Map size={20} className={isOpen ? "text-[#4a9eff]" : "text-white"} />
        {isOpen ? <ChevronDown size={14} className="ml-1 opacity-70" /> : <ChevronUp size={14} className="ml-1 opacity-70" />}
      </button>
    </div>
  );
}
