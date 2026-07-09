import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
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
];

interface ScorePopupProps {
  teamId: string;
  round: number;
  anchor: { x: number; y: number };
  onClose: () => void;
}

export const ScorePopup: React.FC<ScorePopupProps> = ({ teamId, round, anchor, onClose }) => {
  const { addScore, setScore, teams } = useStore();
  const [custom, setCustom] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const customRef = useRef<HTMLInputElement>(null);

  const team = teams.find((t) => t.id === teamId);
  const score = team?.scores[round] ?? 0;

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
  const popW = 270;
  const popH = 290;

  let left = anchor.x - popW / 2;
  let top  = anchor.y + 10;

  if (left < 8)          left = 8;
  if (left + popW > vpW) left = vpW - popW - 8;
  if (top  + popH > vpH) top  = anchor.y - popH - 10;
  if (top  < 8)          top  = 8;

  const apply = (delta: number) => {
    addScore(teamId, round, delta);
    onClose();
  };

  const applyCustom = () => {
    const val = parseFloat(custom);
    if (!isNaN(val)) setScore(teamId, round, Math.max(0, score + val));
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        className="popup-box animate-popup"
        style={{ position: 'fixed', left, top, width: popW, zIndex: 9999 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="popup-team-name">Team {team?.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="popup-score-badge">
                {score} pts
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset grid */}
        <div className="preset-grid">
          {PRESETS.map(({ label, delta }) => (
            <button
              key={label}
              id={`preset-${label.replace('+','plus').replace('-','minus')}`}
              onClick={() => apply(delta)}
              className={`score-preset-btn ${delta > 0 ? 'score-preset-positive' : 'score-preset-negative'}`}
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
                if (e.key === 'Escape') { setShowCustom(false); setCustom(''); }
              }}
              placeholder="e.g. 30 or -15"
              className="custom-score-input"
            />
            <button onClick={applyCustom} className="apply-btn">
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            id="custom-score-btn"
            onClick={() => setShowCustom(true)}
            className="custom-btn"
          >
            <Pencil className="w-3.5 h-3.5" />
            Custom Score
          </button>
        )}
      </div>
    </>
  );
};
