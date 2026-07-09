import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useKeyboard(onFullscreen: () => void) {
  const { setActiveTab, activeTab } = useStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // Tab switching: 1-6
      if (e.key >= '1' && e.key <= '6' && !e.ctrlKey && !e.metaKey) {
        setActiveTab(parseInt(e.key) - 1);
        return;
      }

      // Fullscreen: F
      if (e.key === 'f' || e.key === 'F') {
        onFullscreen();
        return;
      }

      // Focus search: /
      if (e.key === '/') {
        e.preventDefault();
        const el = document.getElementById('search-input');
        el?.focus();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab, setActiveTab, onFullscreen]);
}
