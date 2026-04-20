import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useMemo, useEffect, useRef } from 'react';
import { useProgress } from '@react-three/drei';
import { loadConfig } from './config/loader';
import galleryRawYaml from '../gallery/gallery.yaml?raw';
import { templates } from './gallery/templates';
import type { WaypointDef } from './gallery/templates';
import type { SculptureConfig } from './config/schema';
import { NavigationSystem, type NavigationApi } from './navigation/NavigationSystem';
import { ARIAAnnouncements } from './navigation/ARIAAnnouncements';
import { generateWaypoints } from './gallery/templates/LongHall';
import { InfoPanel } from './ui/InfoPanel';
import { LoadingScreen } from './ui/LoadingScreen';
import { GalleryHeader } from './ui/GalleryHeader';
import { WelcomeModal } from './ui/WelcomeModal';
import { Minimap } from './ui/Minimap';

let galleryConfig: any;
try {
  galleryConfig = loadConfig(galleryRawYaml);
} catch (error) {
  console.error("Failed to load gallery config:", error);
}

function LoadingTracker({ onProgress }: { onProgress: (p: number) => void }) {
  const { progress } = useProgress();
  useEffect(() => {
    onProgress(progress);
  }, [progress, onProgress]);
  return null;
}

function App() {
  const [currentWaypoint, setCurrentWaypoint] = useState<WaypointDef | null>(null);
  const [selectedSculpture, setSelectedSculpture] = useState<SculptureConfig | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const navRef = useRef<NavigationApi>(null);

  const TemplateInfo = galleryConfig ? templates[galleryConfig.template as keyof typeof templates] : null;
  const TemplateComponent = TemplateInfo ? TemplateInfo.component : null;

  const waypoints = useMemo(() => {
    return galleryConfig ? generateWaypoints(galleryConfig.sculptures) : [];
  }, []);

  const hallLength = useMemo(() => {
    if (!galleryConfig?.sculptures) return 20;
    const SPACING = 4;
    const PADDING = 3;
    return Math.ceil(galleryConfig.sculptures.length / 2) * SPACING + 2 * PADDING;
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      <GalleryHeader 
        title={galleryConfig?.gallery?.title || "Museum Gallery"} 
        logo={galleryConfig?.gallery?.logo} 
      />
      <WelcomeModal title={galleryConfig?.gallery?.title || "Museum Gallery"} />

      {galleryConfig && TemplateComponent && (
        <div className="flex-1 w-full relative">
          <Canvas shadows frameloop="demand" camera={{ fov: 60 }}>
            <LoadingTracker onProgress={setLoadProgress} />
            <Suspense fallback={null}>
              <TemplateComponent 
                sculptures={galleryConfig.sculptures} 
                theme={galleryConfig.theme}
                onSelect={setSelectedSculpture}
              />
              {/* @ts-ignore galleryConfig doesn't have accessibility typed yet in our setup but we pass it anyway */}
              <NavigationSystem 
                ref={navRef}
                waypoints={waypoints}
                reducedMotion={galleryConfig.accessibility?.reduced_motion ?? false}
                onWaypointChange={setCurrentWaypoint}
                disabled={selectedSculpture !== null}
              />
            </Suspense>
          </Canvas>
          <LoadingScreen 
            title={galleryConfig?.gallery.title}
            institution={galleryConfig?.gallery.institution}
            progress={loadProgress}
          />
          <Minimap 
            waypoints={waypoints}
            sculptures={galleryConfig.sculptures}
            currentWaypointId={currentWaypoint?.id || ''}
            hallDimensions={{ width: 8, length: hallLength }}
            onNavigate={(id) => navRef.current?.navigate(id)}
            visible={galleryConfig?.navigation?.show_minimap ?? true}
          />
          <InfoPanel 
            sculpture={selectedSculpture} 
            onClose={() => setSelectedSculpture(null)} 
          />
        </div>
      )}

      <ARIAAnnouncements currentWaypoint={currentWaypoint} />
    </div>
  )
}

export default App
