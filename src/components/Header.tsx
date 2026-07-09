import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Trophy, Edit2, Check, X, Maximize2, Minimize2, Menu, X as MenuClose } from 'lucide-react';

interface HeaderProps {
  isFullscreen: boolean;
  onFullscreen: () => void;
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isFullscreen, onFullscreen, onMenuToggle, sidebarOpen
}) => {
  const { title, setTitle } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(title);

  const commit = () => {
    const t = draft.trim();
    if (t) setTitle(t); else setDraft(title);
    setEditing(false);
  };
  const cancel = () => { setDraft(title); setEditing(false); };

  return (
    <header className="header-gradient">
      {/* ── Hamburger / close ── */}
      <button
        id="sidebar-toggle-btn"
        onClick={onMenuToggle}
        className="header-action-btn flex-shrink-0"
        title={sidebarOpen ? 'Close menu' : 'Open menu'}
        aria-label="Toggle navigation"
      >
        {sidebarOpen
          ? <MenuClose className="w-5 h-5" />
          : <Menu      className="w-5 h-5" />
        }
      </button>

      {/* Divider between hamburger and brand */}
      <div className="header-menu-divider" />

      {/* ── Trophy + title ── */}
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
              onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
              className="header-input"
              placeholder="Competition title…"
            />
            <button onClick={commit} className="header-confirm-btn" title="Save">  <Check className="w-4 h-4" /></button>
            <button onClick={cancel} className="header-cancel-btn"  title="Cancel"><X     className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="header-title">{title}</h1>
            <button
              id="edit-title-btn"
              onClick={() => { setDraft(title); setEditing(true); }}
              className="header-edit-btn"
              title="Edit title"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Right actions ── */}
      <div className="header-actions">
        <button
          id="fullscreen-btn"
          onClick={onFullscreen}
          className="header-action-btn"
          title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
