import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { SearchBar } from './SearchBar';
import { Trophy, Download, FileText, Printer, RotateCcw, AlertTriangle, TrendingUp } from 'lucide-react';
import { exportToExcel, exportToPDF, printScoreboard } from '../utils/export';
import confetti from 'canvas-confetti';

const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_ORDER = [1, 0, 2]; // silver left, gold center, bronze right

export const FinalScore: React.FC = () => {
  const { title, teams, roundNames, resetAll } = useStore();
  const [search, setSearch] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const ranked = useMemo(() =>
    [...teams]
      .map((t) => ({ ...t, total: t.scores.reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.total - a.total)
      .map((t, i) => ({ ...t, rank: i + 1 })),
    [teams]
  );

  const filtered = useMemo(
    () => ranked.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [ranked, search]
  );

  const topThree = useMemo(() => ranked.slice(0, 3), [ranked]);

  const handleResetAll = useCallback(() => {
    resetAll();
    setShowResetConfirm(false);
    confetti({
      particleCount: 160,
      spread: 100,
      origin: { y: 0.35 },
      colors: ['#f59e0b', '#6366f1', '#8b5cf6', '#ec4899', '#10b981'],
    });
  }, [resetAll]);

  const highScore = ranked[0]?.total ?? 0;

  return (
    <div className="view-root">

      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="toolbar-left">
          <h2 className="view-title flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0" />
            Final Leaderboard
          </h2>
          <span className="toolbar-stat">
            <TrendingUp className="w-3 h-3" />
            {teams.length} teams · Top score: {highScore} pts
          </span>
        </div>
        <div className="toolbar-actions">
          <button onClick={() => setShowResetConfirm(true)} className="btn-danger">
            <RotateCcw className="w-3.5 h-3.5" /> Reset All
          </button>
          <div className="toolbar-divider" />
          <button onClick={() => exportToExcel(title, teams, roundNames)} className="btn-secondary" title="Export to Excel">
            <Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">Excel</span>
          </button>
          <button onClick={() => exportToPDF(title, teams, roundNames)} className="btn-secondary" title="Export to PDF">
            <FileText className="w-3.5 h-3.5" /><span className="hidden sm:inline">PDF</span>
          </button>
          <button onClick={() => printScoreboard(title, teams, roundNames)} className="btn-secondary" title="Print">
            <Printer className="w-3.5 h-3.5" /><span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* ── Search strip ── */}
      <div className="search-strip">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {/* ── Scrollable body ── */}
      <div className="section-scroll">

        {/* Podium — only when not searching and ≥ 3 teams */}
        {!search && topThree.length >= 3 && (
          <div className="podium-section fade-up">
            {PODIUM_ORDER.map((idx) => {
              const team = topThree[idx];
              const rank = idx + 1; // 1=gold 2=silver 3=bronze
              return (
                <div key={team.id} className={`podium-card podium-${rank}`}>
                  <div className="podium-medal">{MEDALS[rank - 1]}</div>
                  <div className="podium-name">{team.name}</div>
                  <div className="podium-score">{team.total}</div>
                  <div className="podium-label">points</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Leaderboard table ── */}
        <div className="leaderboard-wrap">
          <div className="leaderboard-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th className="leaderboard-th text-center" style={{ width: 56 }}>Rank</th>
                  <th className="leaderboard-th">Team</th>
                  {roundNames.map((n, i) => (
                    <th key={i} className="leaderboard-th text-center hidden sm:table-cell">{n}</th>
                  ))}
                  <th className="leaderboard-th text-center" style={{ width: 90 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((team, idx) => (
                  <tr
                    key={team.id}
                    className={`leaderboard-row
                      ${team.rank === 1 ? 'row-gold'
                      : team.rank === 2 ? 'row-silver'
                      : team.rank === 3 ? 'row-bronze'
                      : idx % 2 === 0 ? 'row-even' : 'row-odd'}`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td className="leaderboard-td text-center rank-cell">
                      {MEDALS[team.rank - 1] ?? <span className="rank-num">{team.rank}</span>}
                    </td>
                    <td className="leaderboard-td">
                      <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{team.name}</span>
                    </td>
                    {team.scores.map((s, i) => (
                      <td key={i} className="leaderboard-td text-center tabular-nums hidden sm:table-cell">
                        {s > 0
                          ? <span className="score-pill">{s}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>
                        }
                      </td>
                    ))}
                    <td className="leaderboard-td text-center">
                      <span className="total-badge">{team.total}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── Reset Confirmation Modal ── */}
      {showResetConfirm && (
        <div className="modal-backdrop" onClick={() => setShowResetConfirm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-row">
              <div className="modal-icon-wrap modal-icon-danger">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="modal-title">Reset Everything?</h3>
                <p className="modal-body">
                  All scores across all rounds will be permanently cleared.
                  This action <strong>cannot be undone</strong>.
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowResetConfirm(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleResetAll} className="btn-danger">Reset Everything</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
