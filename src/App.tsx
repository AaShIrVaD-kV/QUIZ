import React, { useCallback, useState } from 'react';
import { useStore } from './store/useStore';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TabNav } from './components/TabNav';
import { RoundView } from './components/RoundView';
import { FinalScore } from './components/FinalScore';
import { ProjectorView } from './components/ProjectorView';
import { useKeyboard } from './hooks/useKeyboard';

function App() {
  const { activeTab, displayMode } = useStore();
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

  // If in projector mode, display the fullscreen audience view
  if (displayMode === 'projector') {
    return <ProjectorView />;
  }

  return (
    <div className="app-root">
      <div className="app-container">
        {/* Header with drawer toggle */}
        <Header
          isFullscreen={isFullscreen}
          onFullscreen={toggleFullscreen}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
          sidebarOpen={sidebarOpen}
        />

        {/* Body: sidebar drawer + main content */}
        <div className="app-body">
          {/* Sidebar drawer */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* Main content area */}
          <main className="app-main">
            {/* Horizontal tab navigation at the top */}
            <TabNav />

            {/* Inner view */}
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
        <div className="keyboard-hints" style={{ borderTop: '1px solid var(--border-soft)', background: 'var(--bg-surface)', color: 'var(--text-tertiary)' }}>
          <span><kbd>1</kbd>–<kbd>6</kbd> Switch round</span>
          <span><kbd>Ctrl+Z</kbd> Undo</span>
          <span><kbd>Ctrl+Y</kbd> Redo</span>
          <span><kbd>/</kbd> Search</span>
          <span><kbd>F</kbd> Fullscreen</span>
          <span><kbd>Esc</kbd> Close popup</span>
        </div>
      </div>
    </div>
  );
}

export default App;
