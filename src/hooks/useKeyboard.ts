import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { sound } from '../utils/sound';

export function useKeyboard(onFullscreen: () => void) {
  const { setActiveTab, undo, redo } = useStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        sound.playClick();
        return;
      }

      // Redo: Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        sound.playClick();
        return;
      }

      // Tab switching: 1-6
      if (e.key >= '1' && e.key <= '6' && !e.ctrlKey && !e.metaKey) {
        setActiveTab(parseInt(e.key) - 1);
        sound.playClick();
        return;
      }

      // Fullscreen: F
      if (e.key.toLowerCase() === 'f') {
        onFullscreen();
        sound.playClick();
        return;
      }

      // Focus search: /
      if (e.key === '/') {
        e.preventDefault();
        const el = document.getElementById('search-input');
        el?.focus();
        sound.playClick();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveTab, onFullscreen, undo, redo]);
}
