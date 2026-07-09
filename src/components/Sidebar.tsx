import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { sound } from '../utils/sound';
import {
  BarChart2, ChevronRight, Edit2, Check, X,
  PlusCircle, Trash2, RotateCcw, Trophy, Users,
  Eye, EyeOff
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald Green
  '#ef4444', // Crimson Red
  '#f59e0b', // Amber Yellow
  '#8b5cf6', // Violet
  '#ec4899', // Rose Pink
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#64748b'  // Slate Gray
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    roundNames, activeTab, setActiveTab, setRoundName, resetRoundNames,
    teams, addTeam, removeTeam, renameTeam, setTeamColor, setTeamHidden, resetTeamScore
  } = useStore();

  const [editingRound, setEditingRound] = useState<number | null>(null);
  const [roundDraft, setRoundDraft] = useState('');
  
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState(PRESET_COLORS[0]);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showTeamMgr, setShowTeamMgr] = useState(false);

  // Editing teams
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamNameDraft, setTeamNameDraft] = useState('');
  const [activeColorPickerId, setActiveColorPickerId] = useState<string | null>(null);

  const startRoundEdit = (i: number) => {
    setRoundDraft(roundNames[i]);
    setEditingRound(i);
    sound.playClick();
  };

  const commitRoundEdit = () => {
    if (editingRound !== null) {
      const t = roundDraft.trim();
      if (t) {
        setRoundName(editingRound, t);
        sound.playClick();
      }
    }
    setEditingRound(null);
  };

  const navigate = (tab: number) => {
    setActiveTab(tab);
    sound.playClick();
    onClose();
  };

  const handleAddTeam = () => {
    const name = newTeamName.trim();
    if (!name) return;
    addTeam(name, newTeamColor);
    setNewTeamName('');
    setNewTeamColor(PRESET_COLORS[teams.length % PRESET_COLORS.length]);
    setShowAddTeam(false);
    sound.playFanfare();
  };

  const startTeamRename = (id: string, currentName: string) => {
    setTeamNameDraft(currentName);
    setEditingTeamId(id);
    sound.playClick();
  };

  const commitTeamRename = (id: string) => {
    const name = teamNameDraft.trim();
    if (name) {
      renameTeam(id, name);
      sound.playClick();
    }
    setEditingTeamId(null);
  };

  const handleTeamReset = (id: string, name: string) => {
    if (window.confirm(`Reset all scores for "${name}" across all rounds? This will set their Grand Total to 0.`)) {
      resetTeamScore(id);
      sound.playBuzz();
    }
  };

  const handleTeamDelete = (id: string, name: string) => {
    if (window.confirm(`Permanently delete team "${name}" and all their scores? This action cannot be undone.`)) {
      removeTeam(id);
      sound.playBuzz();
    }
  };

  const handleTeamVisibilityToggle = (id: string, currentHidden: boolean) => {
    setTeamHidden(id, !currentHidden);
    sound.playClick();
  };

  const handleTeamColorChange = (id: string, color: string) => {
    setTeamColor(id, color);
    setActiveColorPickerId(null);
    sound.playClick();
  };

  const rounds = roundNames.map((name, i) => ({ name, index: i }));

  return (
    <>
      {/* Backdrop (mobile) */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`} style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-soft)' }}>
        {/* ── Header ── */}
        <div className="sidebar-header" style={{ borderBottom: '1px solid var(--border-soft)' }}>
          <span className="sidebar-logo" style={{ color: 'var(--accent)' }}>
            <BarChart2 className="w-4 h-4" />
            Quiz Scoreboard
          </span>
          <button className="sidebar-close-btn" onClick={() => { onClose(); sound.playClick(); }} title="Close">
            <X className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>

        <div className="sidebar-body">
          {/* ── ROUNDS SECTION ── */}
          <div className="sidebar-section-label" style={{ color: 'var(--text-muted)' }}>Rounds</div>

          {rounds.map(({ name, index }) => (
            <div
              key={index}
              className={`sidebar-item-wrap ${activeTab === index ? 'sidebar-item-active' : ''}`}
              style={{
                background: activeTab === index ? 'var(--bg-subtle)' : 'transparent',
                borderColor: activeTab === index ? 'var(--accent)' : 'transparent'
              }}
            >
              {editingRound === index ? (
                /* Rename inline */
                <div className="sidebar-rename-row">
                  <input
                    autoFocus
                    value={roundDraft}
                    onChange={(e) => setRoundDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRoundEdit();
                      if (e.key === 'Escape') setEditingRound(null);
                    }}
                    className="sidebar-rename-input"
                    placeholder="Round name…"
                    style={{
                      borderBottomColor: 'var(--accent)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <button onClick={commitRoundEdit} className="sidebar-icon-btn text-green-600"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { setEditingRound(null); sound.playClick(); }} className="sidebar-icon-btn text-red-400"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="sidebar-item-row">
                  <button
                    id={`sidebar-round-${index}`}
                    className="sidebar-nav-btn"
                    onClick={() => navigate(index)}
                    style={{ color: activeTab === index ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    <span className="sidebar-dot" style={{ background: activeTab === index ? 'var(--accent)' : 'var(--text-muted)' }} />
                    <span className="sidebar-item-label">{name}</span>
                    {activeTab === index && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" style={{ color: 'var(--accent)' }} />}
                  </button>
                  <button
                    className="sidebar-icon-btn opacity-40 hover:opacity-90"
                    onClick={() => startRoundEdit(index)}
                    title="Rename round"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Reset round names */}
          <button
            className="sidebar-util-btn"
            onClick={() => { resetRoundNames(); sound.playClick(); }}
            title="Reset all round names"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <RotateCcw className="w-3 h-3" />
            Reset round names
          </button>

          <div className="sidebar-divider" style={{ background: 'var(--border-soft)' }} />

          {/* ── FINAL SCORE ── */}
          <div
            className={`sidebar-item-wrap ${activeTab === 5 ? 'sidebar-item-active' : ''}`}
            style={{
              background: activeTab === 5 ? 'var(--bg-subtle)' : 'transparent',
              borderColor: activeTab === 5 ? 'var(--accent)' : 'transparent'
            }}
          >
            <button
              id="sidebar-final"
              className="sidebar-nav-btn sidebar-final-btn"
              onClick={() => navigate(5)}
              style={{ color: activeTab === 5 ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="sidebar-item-label font-semibold">Final Results</span>
              {activeTab === 5 && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" style={{ color: 'var(--accent)' }} />}
            </button>
          </div>

          <div className="sidebar-divider" style={{ background: 'var(--border-soft)' }} />

          {/* ── TEAMS SECTION ── */}
          <div className="sidebar-section-label" style={{ color: 'var(--text-muted)' }}>
            <span>Manage Teams</span>
            <span className="sidebar-count-badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
              {teams.length}
            </span>
          </div>

          {/* Add New Team button */}
          {showAddTeam ? (
            <div className="sidebar-add-team-form" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
              <input
                autoFocus
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTeam();
                  if (e.key === 'Escape') { setShowAddTeam(false); setNewTeamName(''); sound.playClick(); }
                }}
                placeholder="Team name…"
                className="sidebar-add-input"
                style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-soft)'
                }}
              />
              {/* Color picker for new team */}
              <div className="mt-2">
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Team Color</label>
                <div className="flex flex-wrap gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setNewTeamColor(c); sound.playClick(); }}
                      className={`w-5 h-5 rounded-full border transition-all ${
                        newTeamColor === c ? 'scale-110 ring-2 ring-offset-1 ring-amber-400' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: c, borderColor: 'rgba(255,255,255,0.2)' }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-1.5 mt-3">
                <button onClick={handleAddTeam} className="sidebar-add-confirm-btn" style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}>
                  <PlusCircle className="w-3.5 h-3.5" /> Add
                </button>
                <button
                  onClick={() => { setShowAddTeam(false); setNewTeamName(''); sound.playClick(); }}
                  className="sidebar-add-cancel-btn"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              id="add-group-btn"
              className="sidebar-add-btn"
              onClick={() => { setShowAddTeam(true); sound.playClick(); }}
              style={{ border: '1px dashed var(--border-strong)', color: 'var(--text-secondary)' }}
            >
              <PlusCircle className="w-4 h-4 text-emerald-500" />
              Add New Team
            </button>
          )}

          {/* Manage teams toggle */}
          <button
            className="sidebar-util-btn"
            onClick={() => { setShowTeamMgr((v) => !v); sound.playClick(); }}
            style={{ color: 'var(--text-tertiary)' }}
          >
            <Users className="w-3.5 h-3.5" />
            {showTeamMgr ? 'Collapse list' : 'Expand list'} ({teams.length})
          </button>

          {/* Team manager list */}
          {showTeamMgr && (
            <div className="sidebar-team-list mt-1 flex flex-col gap-1.5">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className={`flex flex-col p-2 rounded-lg border transition-all ${
                    t.isHidden ? 'opacity-50' : ''
                  }`}
                  style={{
                    background: 'var(--bg-subtle)',
                    borderColor: 'var(--border-soft)'
                  }}
                >
                  <div className="flex items-center gap-2 justify-between">
                    
                    {/* Left: Color dot & Name */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      
                      {/* Color Picker popover trigger */}
                      <div className="relative">
                        <button
                          onClick={() => {
                            setActiveColorPickerId(activeColorPickerId === t.id ? null : t.id);
                            sound.playClick();
                          }}
                          className="w-3.5 h-3.5 rounded-full border border-white/20 hover:scale-110 transition-transform flex-shrink-0"
                          style={{ backgroundColor: t.color }}
                          title="Change Color"
                        />
                        {activeColorPickerId === t.id && (
                          <div
                            className="absolute left-0 top-6 z-50 p-2 rounded-xl grid grid-cols-5 gap-1.5 shadow-2xl border"
                            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}
                          >
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c}
                                onClick={() => handleTeamColorChange(t.id, c)}
                                className={`w-4 h-4 rounded-full border ${t.color === c ? 'ring-2 ring-amber-400' : ''}`}
                                style={{ backgroundColor: c, borderColor: 'rgba(255,255,255,0.1)' }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Name editing */}
                      {editingTeamId === t.id ? (
                        <input
                          autoFocus
                          value={teamNameDraft}
                          onChange={(e) => setTeamNameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitTeamRename(t.id);
                            if (e.key === 'Escape') setEditingTeamId(null);
                          }}
                          className="flex-1 min-w-0 border-b border-indigo-400 bg-transparent text-xs font-bold text-gray-100 outline-none pb-0.5"
                          style={{ color: 'var(--text-primary)' }}
                        />
                      ) : (
                        <span
                          className="text-xs font-bold truncate cursor-pointer hover:underline"
                          style={{ color: 'var(--text-primary)' }}
                          onClick={() => startTeamRename(t.id, t.name)}
                          title="Click to rename"
                        >
                          {t.name}
                        </span>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {editingTeamId === t.id ? (
                        <>
                          <button onClick={() => commitTeamRename(t.id)} className="p-0.5 text-green-500 hover:text-green-600">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingTeamId(null)} className="p-0.5 text-red-400 hover:text-red-500">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleTeamVisibilityToggle(t.id, t.isHidden)}
                            className={`p-0.5 transition-colors ${t.isHidden ? 'text-gray-500' : 'text-indigo-400 hover:text-indigo-600'}`}
                            title={t.isHidden ? 'Unhide Team' : 'Hide Team'}
                          >
                            {t.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleTeamReset(t.id, t.name)}
                            className="p-0.5 text-amber-500 hover:text-amber-600 transition-colors"
                            title="Reset Team Scores"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleTeamDelete(t.id, t.name)}
                            className="p-0.5 text-red-400 hover:text-red-600 transition-colors"
                            title="Delete Team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
