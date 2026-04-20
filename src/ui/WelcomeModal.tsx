import { useState } from 'react';

interface WelcomeModalProps {
  title: string;
}

export function WelcomeModal({ title }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(() => {
    return localStorage.getItem('galleryWelcomeDismissed') === null;
  });

  const handleDismiss = () => {
    localStorage.setItem('galleryWelcomeDismissed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 text-center transform transition-all">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Welcome to {title}
        </h1>
        
        <div className="text-left mb-8 space-y-3 text-gray-700 dark:text-gray-300">
          <ul className="list-disc pl-5 space-y-3">
            <li>Click the glowing markers on the floor to move through the gallery</li>
            <li>Click any sculpture to learn more about it</li>
            <li>Use arrow keys for keyboard navigation</li>
          </ul>
        </div>
        
        <button
          onClick={handleDismiss}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          Start Exploring
        </button>
      </div>
    </div>
  );
}
