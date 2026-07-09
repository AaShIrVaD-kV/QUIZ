import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { sound } from '../utils/sound';
import {
  Trophy, Edit2, Check, X, Maximize2, Minimize2, Menu,
  Undo2, Redo2, Palette, Monitor, Upload, Volume2, VolumeX
} from 'lucide-react';

interface HeaderProps {
  isFullscreen: boolean;
  onFullscreen: () => void;
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isFullscreen, onFullscreen, onMenuToggle, sidebarOpen
}) => {
  const {
    title, setTitle,
    theme, setTheme,
    displayMode, setDisplayMode,
    excelTemplate, setExcelTemplate,
    past, future, undo, redo
  } = useStore();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const t = draft.trim();
    if (t) {
      setTitle(t);
      sound.playClick();
    } else {
      setDraft(title);
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(title);
    setEditing(false);
    sound.playClick();
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setExcelTemplate(base64);
        sound.playFanfare();
        alert(`Successfully uploaded Excel template: "${file.name}"! Future exports will preserve its formatting.`);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearTemplate = () => {
    if (window.confirm("Remove custom Excel template and revert to default?")) {
      setExcelTemplate(null);
      sound.playClick();
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    sound.toggle(next);
    setSoundEnabled(next);
    if (next) sound.playClick();
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as 'light' | 'dark' | 'quiz';
    setTheme(val);
    // Apply theme class to document element
    document.documentElement.className = `theme-${val}`;
    sound.playClick();
  };

  const handleDisplayModeToggle = () => {
    const nextMode = displayMode === 'scorer' ? 'projector' : 'scorer';
    setDisplayMode(nextMode);
    sound.playFanfare();
  };

  // Ensure theme class is applied initially
  React.useEffect(() => {
    document.documentElement.className = `theme-${theme}`;
  }, [theme]);

  return (
    <header className="header-gradient" style={{ borderBottom: '1px solid var(--border-soft)' }}>
      {/* Left section: navigation & brand */}
      <div className="flex items-center gap-3">
        {displayMode === 'scorer' && (
          <>
            <button
              id="sidebar-toggle-btn"
              onClick={() => { onMenuToggle(); sound.playClick(); }}
              className="header-action-btn flex-shrink-0"
              title={sidebarOpen ? 'Close menu' : 'Open menu'}
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="header-menu-divider" />
          </>
        )}

        <div className="header-inner">
          <div className="header-icon">
            <Trophy className="w-5 h-5 text-yellow-300 drop-shadow" />
          </div>

          {editing ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                id="title-input"
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') cancel();
                }}
                className="header-input"
                placeholder="Competition title…"
              />
              <button onClick={commit} className="header-confirm-btn" title="Save">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={cancel} className="header-cancel-btn" title="Cancel">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="header-title">{title}</h1>
              {displayMode === 'scorer' && (
                <button
                  id="edit-title-btn"
                  onClick={() => { setDraft(title); setEditing(true); sound.playClick(); }}
                  className="header-edit-btn"
                  title="Edit title"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right actions section */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        
        {/* Undo / Redo (Only in Scorer Mode) */}
        {displayMode === 'scorer' && (
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg border border-white/20">
            <button
              onClick={() => { undo(); sound.playClick(); }}
              disabled={past.length === 0}
              className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
              title="Undo Last Change (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => { redo(); sound.playClick(); }}
              disabled={future.length === 0}
              className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
              title="Redo Last Change (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Excel Template Ingestion (Only in Scorer Mode) */}
        {displayMode === 'scorer' && (
          <div className="flex items-center gap-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleTemplateUpload}
              accept=".xlsx,.xls"
              className="hidden"
            />
            {excelTemplate ? (
              <button
                onClick={clearTemplate}
                className="header-action-btn border-yellow-500 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20"
                title="Custom Excel Template is ACTIVE. Click to clear."
              >
                <Check className="w-4 h-4 text-yellow-400 mr-1" />
                <span className="hidden lg:inline text-xs font-semibold">Template Active</span>
              </button>
            ) : (
              <button
                onClick={() => { fileInputRef.current?.click(); sound.playClick(); }}
                className="header-action-btn text-white/90 hover:text-white"
                title="Upload custom Excel (.xlsx) scoreboard template"
              >
                <Upload className="w-4 h-4 mr-1.5" />
                <span className="hidden lg:inline text-xs font-semibold">Upload Template</span>
              </button>
            )}
          </div>
        )}

        {/* Display Mode Toggle */}
        <button
          onClick={handleDisplayModeToggle}
          className={`header-action-btn flex items-center gap-1.5 ${
            displayMode === 'projector' ? 'bg-amber-500 text-slate-900 border-amber-500 hover:bg-amber-400' : ''
          }`}
          title={displayMode === 'scorer' ? 'Switch to Fullscreen Projector / Audience Mode' : 'Switch to Scorer Dashboard'}
        >
          <Monitor className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-semibold">
            {displayMode === 'scorer' ? 'Projector Mode' : 'Exit Projector'}
          </span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          className="header-action-btn"
          title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Theme Selector (Only in Scorer Mode) */}
        {displayMode === 'scorer' && (
          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg border border-white/20">
            <Palette className="w-3.5 h-3.5 text-white/80" />
            <select
              value={theme}
              onChange={handleThemeChange}
              className="bg-transparent text-white text-xs font-semibold border-none outline-none cursor-pointer [color-scheme:dark]"
              style={{ paddingRight: 4 }}
            >
              <option value="quiz" className="bg-slate-900 text-white">Blue + Gold</option>
              <option value="light" className="bg-slate-900 text-white">Light Mode</option>
              <option value="dark" className="bg-slate-900 text-white">Dark Mode</option>
            </select>
          </div>
        )}

        {/* Fullscreen Toggle */}
        <button
          id="fullscreen-btn"
          onClick={() => { onFullscreen(); sound.playClick(); }}
          className="header-action-btn"
          title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
