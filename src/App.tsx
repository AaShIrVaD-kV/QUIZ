import React, { useCallback, useState } from 'react';
import { useStore } from './store/useStore';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { RoundView } from './components/RoundView';
import { FinalScore } from './components/FinalScore';
import { useKeyboard } from './hooks/useKeyboard';

function App() {
  const { activeTab } = useStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  React.useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  useKeyboard(toggleFullscreen);

  return (
    <div className="app-root">
      <div className="app-container">
        {/* Header with hamburger */}
        <Header
          isFullscreen={isFullscreen}
          onFullscreen={toggleFullscreen}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
          sidebarOpen={sidebarOpen}
        />

        {/* Body: sidebar + main content */}
        <div className="app-body">
          {/* Sidebar drawer */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* Main content */}
          <main className="app-main">
            {activeTab < 5 ? (
              <RoundView
                key={activeTab}
                round={activeTab}
                isFullscreen={isFullscreen}
                onFullscreen={toggleFullscreen}
              />
            ) : (
              <FinalScore />
            )}
          </main>
        </div>

        {/* Keyboard hints */}
        <div className="keyboard-hints">
          <span><kbd>1</kbd>–<kbd>6</kbd> Switch round</span>
          <span><kbd>/</kbd> Search</span>
          <span><kbd>F</kbd> Fullscreen</span>
          <span><kbd>Esc</kbd> Close popup</span>
        </div>
      </div>
    </div>
  );
}

export default App;
