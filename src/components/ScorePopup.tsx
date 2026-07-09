import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { sound } from '../utils/sound';
import { X, Pencil, Check } from 'lucide-react';

const PRESETS = [
  { label: '+5',  delta: 5  },
  { label: '+10', delta: 10 },
  { label: '+15', delta: 15 },
  { label: '+20', delta: 20 },
  { label: '+25', delta: 25 },
  { label: '+50', delta: 50 },
  { label: '-5',  delta: -5  },
  { label: '-10', delta: -10 },
  { label: '0',   delta: 0, setVal: true } // Let's allow resetting the question score to 0!
];

interface ScorePopupProps {
  teamId: string;
  round: number;
  questionId: string;
  anchor: { x: number; y: number };
  onClose: () => void;
}

export const ScorePopup: React.FC<ScorePopupProps> = ({ teamId, round, questionId, anchor, onClose }) => {
  const { addScore, setScore, clearTeamQuestionScore, resetTeamRoundScore, teams, roundQuestions } = useStore();
  const [custom, setCustom] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const customRef = useRef<HTMLInputElement>(null);

  const team = teams.find((t) => t.id === teamId);
  const score = team?.scores[round]?.[questionId] ?? 0;
  
  const qList = roundQuestions[round] || [];
  const question = qList.find((q) => q.id === questionId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (showCustom) customRef.current?.focus();
  }, [showCustom]);

  // Smart positioning: keep popup inside viewport
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;
  const popW = 280;
  const popH = 320;

  let left = anchor.x - popW / 2;
  let top  = anchor.y + 10;

  if (left < 8)          left = 8;
  if (left + popW > vpW) left = vpW - popW - 8;
  if (top  + popH > vpH) top  = anchor.y - popH - 10;
  if (top  < 8)          top  = 8;

  const apply = (delta: number, isSetVal: boolean = false) => {
    if (isSetVal) {
      setScore(teamId, round, questionId, delta);
      sound.playClick();
    } else {
      addScore(teamId, round, questionId, delta);
      if (delta > 0) {
        sound.playDing();
      } else if (delta < 0) {
        sound.playBuzz();
      } else {
        sound.playClick();
      }
    }

    onClose();
  };

  const applyCustom = () => {
    const val = parseFloat(custom);
    if (!isNaN(val)) {
      setScore(teamId, round, questionId, Math.max(0, val));
      if (val > score) {
        sound.playDing();
      } else if (val < score) {
        sound.playBuzz();
      } else {
        sound.playClick();
      }
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[9998] bg-black/10 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className="popup-box animate-popup rounded-2xl shadow-2xl border p-4"
        style={{
          position: 'fixed',
          left,
          top,
          width: popW,
          zIndex: 9999,
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
          boxShadow: 'var(--sh-popup)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 border-b pb-2.5" style={{ borderColor: 'var(--border-soft)' }}>
          <div>
            <p className="popup-team-name font-black text-sm" style={{ color: 'var(--text-primary)' }}>
              {team?.name}
            </p>
            <p className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">
              Scoring {question?.name || 'Question'}
            </p>
          </div>
          <button
            onClick={() => { onClose(); sound.playClick(); }}
            className="p-1.5 rounded-lg hover:bg-black/10 text-gray-400 hover:text-red-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current score badge */}
        <div className="flex items-center justify-center bg-black/10 rounded-xl py-2.5 mb-4 border border-white/5" style={{ borderColor: 'var(--border-soft)' }}>
          <span className="text-xs uppercase font-bold text-gray-400 mr-2">Current score:</span>
          <span className="font-mono font-black text-base" style={{ color: team?.color }}>
            {score} pts
          </span>
        </div>

        {/* Preset grid */}
        <div className="preset-grid grid grid-cols-3 gap-2 mb-4">
          {PRESETS.map(({ label, delta, setVal }) => (
            <button
              key={label}
              id={`preset-${label.replace('+','plus').replace('-','minus')}`}
              onClick={() => apply(delta, setVal)}
              className={`score-preset-btn font-black text-sm py-2 rounded-xl border transition-all hover:scale-105 ${
                setVal 
                  ? 'border-gray-500 bg-gray-500/10 text-gray-300 hover:bg-gray-500/20'
                  : delta > 0 
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                    : 'border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Custom */}
        {showCustom ? (
          <div className="flex gap-2 mt-1">
            <input
              ref={customRef}
              type="number"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter')  applyCustom();
                if (e.key === 'Escape') { setShowCustom(false); setCustom(''); sound.playClick(); }
              }}
              placeholder="e.g. 10 or 30"
              className="custom-score-input flex-1 bg-black/10 border text-sm font-bold p-2 rounded-xl outline-none"
              style={{ borderColor: 'var(--border-soft)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={applyCustom}
              className="apply-btn bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl p-2 flex items-center justify-center"
              style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            id="custom-score-btn"
            onClick={() => { setShowCustom(true); sound.playClick(); }}
            className="custom-btn w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl border transition-all hover:bg-white/5"
            style={{ borderColor: 'var(--border-soft)', color: 'var(--text-secondary)' }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Custom Score
          </button>
        )}

        {/* Actions row: Clear Question and Reset Team Total */}
        <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
          <button
            onClick={() => {
              if (window.confirm(`Clear score for ${team?.name} on this question?`)) {
                clearTeamQuestionScore(teamId, round, questionId);
                sound.playBuzz();
                onClose();
              }
            }}
            className="flex-1 text-[10px] font-bold py-1.5 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-all text-center"
            title="Reset question score back to Pending"
          >
            Clear Question
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Reset ALL scores for "${team?.name}" in this round to 0?`)) {
                resetTeamRoundScore(teamId, round);
                sound.playBuzz();
                onClose();
              }
            }}
            className="flex-1 text-[10px] font-bold py-1.5 rounded-xl border border-gray-500/30 bg-gray-500/5 text-gray-400 hover:bg-gray-500/10 transition-all text-center"
            title="Reset all question scores for this team in this round"
          >
            Reset Round Total
          </button>
        </div>
      </div>
    </>
  );
};
