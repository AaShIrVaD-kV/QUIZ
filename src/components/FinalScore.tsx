import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { sound } from '../utils/sound';
import { SearchBar } from './SearchBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Download, FileText, Printer, RotateCcw, AlertTriangle, TrendingUp, FileSpreadsheet } from 'lucide-react';
import { exportToExcel, exportToPDF, exportToCSV, printScoreboard } from '../utils/export';
import confetti from 'canvas-confetti';

const MEDALS = ['🏆🥇 Gold', '🥈 Silver', '🥉 Bronze'];
const PODIUM_ORDER = [1, 0, 2]; // silver left, gold center, bronze right

export const FinalScore: React.FC = () => {
  const { title, teams, roundNames, roundQuestions, resetAll, excelTemplate } = useStore();
  const [search, setSearch] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Calculate scores and sort non-hidden teams
  const ranked = useMemo(() => {
    return teams
      .filter((t) => !t.isHidden)
      .map((t) => {
        const rTotals = Array(5).fill(0);
        for (let ri = 0; ri < 5; ri++) {
          const qScores = t.scores[ri] || {};
          rTotals[ri] = Object.values(qScores).reduce((sum, s) => sum + s, 0);
        }
        const total = rTotals.reduce((a, b) => a + b, 0);
        return {
          ...t,
          rTotals,
          total
        };
      })
      .sort((a, b) => b.total - a.total)
      .map((t, i) => ({ ...t, rank: i + 1 }));
  }, [teams]);

  const filtered = useMemo(
    () => ranked.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [ranked, search]
  );

  const topThree = useMemo(() => ranked.slice(0, 3), [ranked]);

  const handleResetAll = useCallback(() => {
    resetAll();
    setShowResetConfirm(false);
    sound.playBuzz();
    confetti({
      particleCount: 180,
      spread: 120,
      origin: { y: 0.35 },
      colors: ['#d4af37', '#f59e0b', '#3b82f6', '#ec4899', '#10b981'],
    });
  }, [resetAll]);

  const highScore = ranked[0]?.total ?? 0;

  return (
    <div className="view-root">
      {/* ── Toolbar ── */}
      <div className="toolbar" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-soft)' }}>
        <div className="toolbar-left">
          <h2 className="view-title flex items-center gap-2" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
            <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0" />
            Final Leaderboard
          </h2>
          <span className="toolbar-stat" style={{ color: 'var(--text-tertiary)' }}>
            <TrendingUp className="w-3.5 h-3.5" />
            {ranked.length} teams ranked · Top score: {highScore} pts
          </span>
        </div>

        <div className="toolbar-actions">
          {/* Reset button */}
          <button onClick={() => { setShowResetConfirm(true); sound.playClick(); }} className="btn-danger flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
          
          <div className="toolbar-divider" style={{ background: 'var(--border-soft)' }} />
          
          {/* Exports */}
          <button
            onClick={() => { exportToExcel(title, teams, roundNames, roundQuestions, excelTemplate); sound.playClick(); }}
            className="btn-secondary"
            title="Export to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={() => { exportToPDF(title, teams, roundNames); sound.playClick(); }}
            className="btn-secondary"
            title="Export to PDF"
          >
            <FileText className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={() => { exportToCSV(title, teams, roundNames); sound.playClick(); }}
            className="btn-secondary"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={() => { printScoreboard(title, teams, roundNames, roundQuestions, 5, excelTemplate); sound.playClick(); }}
            className="btn-secondary"
            title="Print Leaderboard using template layout"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-400" style={{ color: 'var(--accent)' }} />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* ── Search strip ── */}
      <div className="search-strip py-3 px-5" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-soft)' }}>
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {/* ── Scrollable Leaderboard Area ── */}
      <div className="section-scroll flex-1 overflow-y-auto p-5 scrollbar-thin">
        
        {/* Podium — only when not searching and ≥ 3 teams exist */}
        {!search && topThree.length >= 3 && (
          <div className="podium-section fade-up flex justify-center items-end gap-6 w-full mb-8 mt-4">
            {PODIUM_ORDER.map((idx) => {
              const team = topThree[idx];
              if (!team) return null;
              const rank = idx + 1; // 1 = Gold, 2 = Silver, 3 = Bronze
              return (
                <motion.div
                  key={team.id}
                  className={`podium-card podium-${rank} flex-1 text-center p-4 rounded-2xl border shadow-xl relative`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.15, type: 'spring' }}
                  whileHover={{ y: -5 }}
                  style={{
                    background: 'var(--grad-card)',
                    borderColor: rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : '#c07b35',
                    borderTopWidth: 5,
                    borderTopColor: team.color
                  }}
                >
                  <div className="podium-medal text-xl mb-1">{MEDALS[rank - 1]}</div>
                  <div className="podium-name font-black text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {team.name}
                  </div>
                  <div className="podium-score text-2xl font-black mt-2 font-mono" style={{ color: team.color }}>
                    {team.total}
                  </div>
                  <div className="podium-label text-[9px] uppercase font-bold text-gray-400">
                    Grand Total
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Leaderboard Table with Framer Motion row-swap animations ── */}
        <div className="leaderboard-wrap w-full">
          <div className="leaderboard-wrapper rounded-2xl overflow-hidden border shadow-lg" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}>
            <table className="leaderboard-table min-w-full border-collapse text-left">
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '2px solid var(--border-strong)' }}>
                  <th className="leaderboard-th text-center p-3 font-bold text-xs uppercase" style={{ width: 70, color: 'var(--text-primary)' }}>Rank</th>
                  <th className="leaderboard-th p-3 font-bold text-xs uppercase" style={{ color: 'var(--text-primary)' }}>Team</th>
                  {roundNames.map((n, i) => (
                    <th key={i} className="leaderboard-th text-center p-3 font-bold text-xs uppercase hidden sm:table-cell" style={{ color: 'var(--text-primary)' }}>{n}</th>
                  ))}
                  <th className="leaderboard-th text-center p-3 font-bold text-xs uppercase" style={{ width: 110, color: 'var(--text-primary)' }}>Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <AnimatePresence initial={false}>
                  {filtered.map((team, idx) => {
                    const isGold = team.rank === 1;
                    const isSilver = team.rank === 2;
                    const isBronze = team.rank === 3;
                    
                    return (
                      <motion.tr
                        layout
                        key={team.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, type: 'spring', stiffness: 200, damping: 25 }}
                        className={`leaderboard-row transition-colors hover:bg-white/5 ${
                          isGold ? 'row-gold bg-amber-500/5'
                          : isSilver ? 'row-silver bg-slate-500/5'
                          : isBronze ? 'row-bronze bg-orange-500/5'
                          : idx % 2 === 0 ? 'row-even' : 'row-odd'
                        }`}
                        style={{
                          borderLeft: `4px solid ${team.color}`
                        }}
                      >
                        {/* Rank */}
                        <td className="leaderboard-td text-center p-3 font-mono font-bold text-sm">
                          {isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : team.rank}
                        </td>
                        
                        {/* Team Name */}
                        <td className="leaderboard-td p-3">
                          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{team.name}</span>
                        </td>
                        
                        {/* Round breakdown */}
                        {team.rTotals.map((rScore, ri) => (
                          <td key={ri} className="leaderboard-td text-center p-3 tabular-nums hidden sm:table-cell font-mono text-xs">
                            {rScore > 0 ? (
                              <span className="score-pill px-2 py-0.5 rounded-full text-xs font-bold bg-black/10" style={{ color: 'var(--text-primary)' }}>
                                {rScore}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                        ))}
                        
                        {/* Grand Total */}
                        <td className="leaderboard-td text-center p-3 font-mono font-black text-base" style={{ color: team.color }}>
                          {team.total}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── Reset Confirmation Modal ── */}
      {showResetConfirm && (
        <div className="modal-backdrop" onClick={() => { setShowResetConfirm(false); sound.playClick(); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>
            <div className="modal-icon-row">
              <div className="modal-icon-wrap modal-icon-danger" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="modal-title" style={{ color: 'var(--text-primary)' }}>Reset Everything?</h3>
                <p className="modal-body" style={{ color: 'var(--text-secondary)' }}>
                  All scores across all rounds for all teams will be permanently cleared.
                  This action is saved to undo history.
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => { setShowResetConfirm(false); sound.playClick(); }} className="btn-secondary">Cancel</button>
              <button onClick={handleResetAll} className="btn-danger">Reset Entire Competition</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
