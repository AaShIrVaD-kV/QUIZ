import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { sound } from '../utils/sound';
import { motion } from 'framer-motion';
import { Edit2, Check, X } from 'lucide-react';

interface TeamCardProps {
  team: any;
  qScore: number | undefined;
  totalScore: number;
  qName: string;
  onClick: (e: React.MouseEvent) => void;
  isSelected: boolean;
  animDelay?: number;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team, qScore, totalScore, qName, onClick, isSelected, animDelay = 0
}) => {
  const { renameTeam } = useStore();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(team.name);
  const scoreRef = useRef<HTMLSpanElement>(null);

  const commitRename = () => {
    const t = nameDraft.trim();
    if (t) {
      renameTeam(team.id, t);
      sound.playClick();
    } else {
      setNameDraft(team.name);
    }
    setEditingName(false);
  };

  return (
    <motion.div
      id={`team-card-${team.id}`}
      className={`team-card ${isSelected ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: animDelay / 1000 }}
      whileHover={{ y: -4, boxShadow: 'var(--sh-card-hover)' }}
      style={{
        borderTop: `4px solid ${team.color}`,
        background: 'var(--grad-card)',
        borderColor: isSelected ? 'var(--accent)' : 'var(--border-soft)'
      }}
    >
      {/* Team name row */}
      <div className="team-name-row" style={{ borderBottom: '1px solid var(--border-soft)' }}>
        {editingName ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') { setNameDraft(team.name); setEditingName(false); sound.playClick(); }
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 bg-transparent outline-none text-sm font-bold pb-0.5"
              style={{ color: 'var(--text-primary)', borderBottom: `2px solid ${team.color}` }}
            />
            <button onClick={(e) => { e.stopPropagation(); commitRename(); }} className="text-green-500 hover:text-green-600">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNameDraft(team.name);
                setEditingName(false);
                sound.playClick();
              }}
              className="text-red-400 hover:text-red-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <span className="team-name" style={{ color: 'var(--text-primary)' }}>{team.name}</span>
            <button
              className="team-name-edit-btn"
              onClick={(e) => { e.stopPropagation(); setNameDraft(team.name); setEditingName(true); sound.playClick(); }}
              style={{ color: 'var(--text-tertiary)' }}
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </>
        )}
      </div>

      {/* Score tap area */}
      <button
        className="score-display flex-1 flex flex-col justify-center items-center py-4 cursor-pointer outline-none bg-transparent border-none"
        onClick={onClick}
        title={`Tap to score ${team.name} for ${qName}`}
      >
        {qScore === undefined ? (
          <>
            <span ref={scoreRef} className="score-number font-mono text-3xl font-black text-slate-500">
              —
            </span>
            <span className="score-label text-[9px] uppercase font-bold text-gray-500 mt-1 px-2 py-0.5 rounded-full bg-slate-800/40 border border-slate-700/30">
              Pending
            </span>
          </>
        ) : (
          <>
            <span ref={scoreRef} className="score-number font-mono text-3xl font-black flex items-center gap-1" style={{ color: team.color }}>
              {qScore}
            </span>
            <span className="score-label text-[9px] uppercase font-bold mt-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-extrabold animate-fade-in">
              ✓ Scored
            </span>
          </>
        )}
        <span className="tap-hint text-[9px] mt-2 opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }}>
          ▸ tap to score
        </span>
      </button>

      {/* Footer: Round total */}
      <div className="flex items-center justify-center py-2 bg-black/10 mt-auto rounded-b-xl border-t" style={{ borderColor: 'var(--border-soft)' }}>
        <span className="text-[10px] uppercase font-extrabold text-gray-400 mr-1.5">Round Total:</span>
        <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{totalScore} pts</span>
      </div>
    </motion.div>
  );
};
