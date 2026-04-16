import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { OrbitControls } from '@react-three/drei';
import { loadConfig } from './config/loader';
import galleryRawYaml from '../gallery/gallery.yaml?raw';
import { templates } from './gallery/templates';

function App() {
  let galleryConfig;
  try {
    galleryConfig = loadConfig(galleryRawYaml);
    console.log("Gallery Config Loaded:", galleryConfig);
  } catch (error) {
    console.error("Failed to load gallery config:", error);
  }

  const TemplateInfo = galleryConfig ? templates[galleryConfig.template] : null;
  const TemplateComponent = TemplateInfo ? TemplateInfo.component : null;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="p-4 text-center z-10 bg-white dark:bg-gray-800 shrink-0">
        <h1 className="text-4xl font-bold">{galleryConfig?.gallery.title || "Museum Gallery"}</h1>
        {galleryConfig && (
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loaded {galleryConfig.sculptures.length} sculptures. Check developer console for config details.
          </p>
        )}
      </div>

      {galleryConfig && TemplateComponent && (
        <div className="flex-1 w-full relative">
          {/* Default view set to entrance waypoint looking down the hall */}
          <Canvas shadows camera={{ position: [0, 1.6, 1], fov: 60 }}>
            <OrbitControls target={[0, 1.6, 3]} />
            <Suspense fallback={null}>
              <TemplateComponent 
                sculptures={galleryConfig.sculptures} 
                theme={galleryConfig.theme}
                onSelect={(s: any) => console.log('Selected:', s.title)}
              />
            </Suspense>
          </Canvas>
        </div>
      )}
    </div>
  )
}

export default App
