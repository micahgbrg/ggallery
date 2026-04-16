
import { loadConfig } from './config/loader';
import galleryRawYaml from '../gallery/gallery.yaml?raw';

function App() {
  let galleryConfig;
  try {
    galleryConfig = loadConfig(galleryRawYaml);
    console.log("Gallery Config Loaded:", galleryConfig);
  } catch (error) {
    console.error("Failed to load gallery config:", error);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 text-center">
      <div>
        <h1 className="text-4xl font-bold">{galleryConfig?.gallery.title || "Museum Gallery"}</h1>
        {galleryConfig && (
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loaded {galleryConfig.sculptures.length} sculptures. Check developer console for config details.
          </p>
        )}
      </div>
    </div>
  )
}

export default App

