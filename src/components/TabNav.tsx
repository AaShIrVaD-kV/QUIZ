import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Edit2, Check, X, RotateCcw, BarChart2 } from 'lucide-react';

export const TabNav: React.FC = () => {
  const { roundNames, activeTab, setActiveTab, setRoundName, resetRoundNames } = useStore();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null) inputRef.current?.focus();
  }, [editingIndex]);

  const startEdit = (i: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(roundNames[i]);
    setEditingIndex(i);
  };

  const commit = () => {
    if (editingIndex === null) return;
    const t = draft.trim();
    if (t) setRoundName(editingIndex, t);
    setEditingIndex(null);
  };

  const cancel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingIndex(null);
  };

  const tabs = [
    ...roundNames.map((name, i) => ({ label: name, index: i, isRound: true })),
    { label: 'Final Score', index: 5, isRound: false },
  ];

  return (
    <nav className="tab-nav">
      <div className="tab-nav-inner scrollbar-hide">
        {tabs.map(({ label, index, isRound }) => (
          <div key={index} className="flex-shrink-0 relative flex items-stretch">
            {/* Tab button — separate from rename btn */}
            <button
              id={`tab-${index}`}
              onClick={() => setActiveTab(index)}
              className={`tab-btn ${activeTab === index ? 'tab-active' : ''}`}
            >
              {!isRound && <BarChart2 className="w-3.5 h-3.5 opacity-70" />}

              {editingIndex === index ? (
                <span className="flex items-center gap-1.5">
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
                    onClick={(e) => e.stopPropagation()}
                    className="tab-rename-input"
                  />
                </span>
              ) : (
                <span>{label}</span>
              )}
            </button>

            {/* Inline rename confirm / cancel OR rename trigger — outside the tab button */}
            {isRound && (
              editingIndex === index ? (
                <span className="flex items-center gap-0.5 pr-1">
                  <button onClick={commit}  className="p-1 text-green-600 hover:text-green-700 transition-colors"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={(e) => cancel(e)} className="p-1 text-red-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                </span>
              ) : (
                <button
                  onClick={(e) => startEdit(index, e)}
                  className="tab-rename-btn self-center mr-1"
                  title={`Rename ${label}`}
                >
                  <Edit2 className="w-2.5 h-2.5" />
                </button>
              )
            )}
          </div>
        ))}

        <button
          id="reset-round-names-btn"
          onClick={resetRoundNames}
          title="Reset all round names"
          className="tab-reset-names-btn"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">Reset Names</span>
        </button>
      </div>
    </nav>
  );
};
