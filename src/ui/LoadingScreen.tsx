import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  title?: string;
  institution?: string;
  progress: number;
}

export function LoadingScreen({ title, institution, progress }: LoadingScreenProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    // Treat everything 100 or above as finished.
    // Also handle case where it might briefly dip or we might just wait for the component to unmount.
    if (progress >= 100) {
      setIsLoaded(true);
      const timeout = setTimeout(() => {
        setIsMounted(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [progress]);

  if (!isMounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 transition-opacity duration-500 ${
        isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <h1 className="text-4xl font-bold text-white mb-2">
        {title || 'Virtual Gallery'}
      </h1>
      <p className="text-slate-400 mb-8">
        {institution || 'Museum'}
      </p>

      <div className="w-full max-w-[300px]">
        <div className="h-1 w-full bg-slate-700 rounded overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
        <div className="mt-2 text-center">
          <p className="text-xs text-slate-500">
            Loading gallery... {Math.round(progress)}%
          </p>
        </div>
      </div>
    </div>
  );
}
