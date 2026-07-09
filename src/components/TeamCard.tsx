import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { Team } from '../store/useStore';
import { Undo2, RotateCcw, Edit2, Check, X } from 'lucide-react';

interface TeamCardProps {
  team: Team;
  round: number;
  onClick: (e: React.MouseEvent) => void;
  isSelected: boolean;
  animDelay?: number;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, round, onClick, isSelected, animDelay = 0 }) => {
  const { undoLastChange, resetTeamRoundScore, renameTeam } = useStore();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(team.name);
  const scoreRef = useRef<HTMLSpanElement>(null);

  const score = team.scores[round];
  const canUndo = team.history.some((h) => h.round === round);

  const commitRename = () => {
    const t = nameDraft.trim();
    if (t) renameTeam(team.id, t);
    else setNameDraft(team.name);
    setEditingName(false);
  };

  const triggerPulse = () => {
    scoreRef.current?.classList.remove('score-pulse');
    void scoreRef.current?.offsetWidth; // reflow
    scoreRef.current?.classList.add('score-pulse');
  };

  const handleUndo = (e: React.MouseEvent) => {
    e.stopPropagation();
    undoLastChange(team.id);
    triggerPulse();
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetTeamRoundScore(team.id, round);
    triggerPulse();
  };

  return (
    <div
      id={`team-card-${team.id}`}
      className={`team-card ${isSelected ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* Team name row */}
      <div className="team-name-row">
        {editingName ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') { setNameDraft(team.name); setEditingName(false); }
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 border-b-2 border-indigo-400 bg-transparent outline-none text-sm font-bold text-indigo-700 pb-0.5"
            />
            <button onClick={(e) => { e.stopPropagation(); commitRename(); }} className="text-green-500 hover:text-green-600">
              <Check className="w-3 h-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setNameDraft(team.name); setEditingName(false); }} className="text-red-400 hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <>
            <span className="team-name">{team.name}</span>
            <button
              className="team-name-edit-btn"
              onClick={(e) => { e.stopPropagation(); setNameDraft(team.name); setEditingName(true); }}
            >
              <Edit2 className="w-2.5 h-2.5" />
            </button>
          </>
        )}
      </div>

      {/* Score tap area */}
      <button className="score-display" onClick={onClick} title="Tap to score">
        <span ref={scoreRef} className="score-number">{score}</span>
        <span className="score-label">pts</span>
        <span className="tap-hint">▸ tap to score</span>
      </button>

      {/* Undo / Reset */}
      <div className="team-actions">
        <button
          className="team-action-btn"
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo last change"
        >
          <Undo2 className="w-3 h-3" />
          <span>Undo</span>
        </button>
        <button
          className="team-action-btn"
          onClick={handleReset}
          disabled={score === 0}
          title="Reset this round's score"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
