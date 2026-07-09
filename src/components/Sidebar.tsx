import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  BarChart2, ChevronRight, Edit2, Check, X,
  PlusCircle, Trash2, RotateCcw, Trophy, Users
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    roundNames, activeTab, setActiveTab, setRoundName, resetRoundNames,
    teams, addTeam, removeTeam
  } = useStore();

  const [editingRound, setEditingRound] = useState<number | null>(null);
  const [roundDraft, setRoundDraft]     = useState('');
  const [newTeamName, setNewTeamName]   = useState('');
  const [showAddTeam, setShowAddTeam]   = useState(false);
  const [showTeamMgr, setShowTeamMgr]   = useState(false);

  const startRoundEdit = (i: number) => { setRoundDraft(roundNames[i]); setEditingRound(i); };
  const commitRoundEdit = () => {
    if (editingRound !== null) {
      const t = roundDraft.trim();
      if (t) setRoundName(editingRound, t);
    }
    setEditingRound(null);
  };

  const navigate = (tab: number) => {
    setActiveTab(tab);
    onClose();
  };

  const handleAddTeam = () => {
    const name = newTeamName.trim();
    if (!name) return;
    addTeam(name);
    setNewTeamName('');
    setShowAddTeam(false);
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
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* ── Header ── */}
        <div className="sidebar-header">
          <span className="sidebar-logo">
            <BarChart2 className="w-4 h-4" />
            Navigation
          </span>
          <button className="sidebar-close-btn" onClick={onClose} title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="sidebar-body">

          {/* ── ROUNDS SECTION ── */}
          <div className="sidebar-section-label">Rounds</div>

          {rounds.map(({ name, index }) => (
            <div key={index} className={`sidebar-item-wrap ${activeTab === index ? 'sidebar-item-active' : ''}`}>
              {editingRound === index ? (
                /* Rename inline */
                <div className="sidebar-rename-row">
                  <input
                    autoFocus
                    value={roundDraft}
                    onChange={(e) => setRoundDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitRoundEdit(); if (e.key === 'Escape') setEditingRound(null); }}
                    className="sidebar-rename-input"
                    placeholder="Round name…"
                  />
                  <button onClick={commitRoundEdit}            className="sidebar-icon-btn text-green-600"><Check  className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setEditingRound(null)} className="sidebar-icon-btn text-red-400"><X      className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="sidebar-item-row">
                  <button
                    id={`sidebar-round-${index}`}
                    className="sidebar-nav-btn"
                    onClick={() => navigate(index)}
                  >
                    <span className="sidebar-dot" />
                    <span className="sidebar-item-label">{name}</span>
                    {activeTab === index && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
                  </button>
                  <button
                    className="sidebar-icon-btn opacity-40 hover:opacity-90"
                    onClick={() => startRoundEdit(index)}
                    title="Rename round"
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
            onClick={() => { resetRoundNames(); }}
            title="Reset all round names"
          >
            <RotateCcw className="w-3 h-3" />
            Reset round names
          </button>

          <div className="sidebar-divider" />

          {/* ── FINAL SCORE ── */}
          <div className={`sidebar-item-wrap ${activeTab === 5 ? 'sidebar-item-active' : ''}`}>
            <button
              id="sidebar-final"
              className="sidebar-nav-btn sidebar-final-btn"
              onClick={() => navigate(5)}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="sidebar-item-label font-semibold">Final Score</span>
              {activeTab === 5 && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
            </button>
          </div>

          <div className="sidebar-divider" />

          {/* ── GROUPS / TEAMS SECTION ── */}
          <div className="sidebar-section-label">
            <span>Groups</span>
            <span className="sidebar-count-badge">{teams.length}</span>
          </div>

          {/* Add New Group button */}
          {showAddTeam ? (
            <div className="sidebar-add-team-form">
              <input
                autoFocus
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddTeam(); if (e.key === 'Escape') { setShowAddTeam(false); setNewTeamName(''); } }}
                placeholder="Group / Team name…"
                className="sidebar-add-input"
              />
              <div className="flex gap-1.5 mt-2">
                <button onClick={handleAddTeam} className="sidebar-add-confirm-btn">
                  <PlusCircle className="w-3.5 h-3.5" /> Add
                </button>
                <button onClick={() => { setShowAddTeam(false); setNewTeamName(''); }} className="sidebar-add-cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              id="add-group-btn"
              className="sidebar-add-btn"
              onClick={() => setShowAddTeam(true)}
            >
              <PlusCircle className="w-4 h-4" />
              Add New Group
            </button>
          )}

          {/* Manage teams toggle */}
          <button
            className="sidebar-util-btn"
            onClick={() => setShowTeamMgr((v) => !v)}
          >
            <Users className="w-3 h-3" />
            {showTeamMgr ? 'Hide' : 'Manage'} Groups ({teams.length})
          </button>

          {/* Team manager list */}
          {showTeamMgr && (
            <div className="sidebar-team-list">
              {teams.map((t) => (
                <div key={t.id} className="sidebar-team-row">
                  <span className="sidebar-team-name">{t.name}</span>
                  <button
                    onClick={() => { if (window.confirm(`Remove group "${t.name}"?`)) removeTeam(t.id); }}
                    className="sidebar-icon-btn text-red-400 hover:text-red-600"
                    title={`Remove ${t.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
