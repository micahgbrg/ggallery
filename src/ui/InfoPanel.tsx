import { useEffect, useState } from 'react';
import type { SculptureConfig } from '../config/schema';

interface InfoPanelProps {
  sculpture: SculptureConfig | null;
  onClose: () => void;
}

export function InfoPanel({ sculpture, onClose }: InfoPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSculpture, setActiveSculpture] = useState<SculptureConfig | null>(null);

  useEffect(() => {
    if (sculpture) {
      setActiveSculpture(sculpture);
      // Small delay to allow the DOM to render the panel before animating it in
      requestAnimationFrame(() => {
        setIsOpen(true);
      });
    } else {
      setIsOpen(false);
      // Small delay to allow animation to complete before removing content
      const timer = setTimeout(() => {
        setActiveSculpture(null);
      }, 300); // 300ms matches Tailwind duration-300
      return () => clearTimeout(timer);
    }
  }, [sculpture]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      if (!isOpen) return;
      
      const panelNode = document.getElementById('info-panel-content');
      if (panelNode && panelNode.contains(e.target as Node)) {
        return;
      }


      onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!activeSculpture && !isOpen) return null;

  return (
    <div 
      className="absolute inset-0 z-50 pointer-events-none overflow-hidden"
    >
      <div 
        id="info-panel-content"
        className={`absolute top-0 right-0 h-full w-full md:w-[400px] bg-white/95 backdrop-blur-sm shadow-xl p-6 overflow-y-auto transform transition-transform duration-300 ease-out pointer-events-auto border-l border-gray-200 dark:bg-gray-900/95 dark:border-gray-800 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mt-8">
          {activeSculpture?.image && (
            <div className="mb-6 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800">
              <img 
                src={activeSculpture.image} 
                alt={activeSculpture.title} 
                className="w-full h-auto object-cover max-h-[300px]"
              />
            </div>
          )}
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{activeSculpture?.title}</h2>
          
          {(activeSculpture?.artist || activeSculpture?.date) && (
            <p className="text-lg text-gray-700 dark:text-gray-300 font-medium mb-1">
              {[activeSculpture?.artist, activeSculpture?.date].filter(Boolean).join(', ')}
            </p>
          )}
          
          {activeSculpture?.medium && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-6">
              {activeSculpture.medium}
            </p>
          )}
          
          <hr className="border-gray-200 dark:border-gray-800 my-6" />
          
          {activeSculpture?.description && (
            <div className="prose prose-gray dark:prose-invert prose-sm max-w-none text-gray-800 dark:text-gray-200 font-normal">
              <p className="whitespace-pre-wrap">{activeSculpture.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
