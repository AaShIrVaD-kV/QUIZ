import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { TeamCard } from './TeamCard';
import { SearchBar } from './SearchBar';
import { ScorePopup } from './ScorePopup';
import { AlertTriangle, RotateCcw, Download, FileText, Printer, Users } from 'lucide-react';
import { exportToExcel, exportToPDF, printScoreboard } from '../utils/export';
import confetti from 'canvas-confetti';

interface RoundViewProps {
  round: number;
  isFullscreen: boolean;
  onFullscreen: () => void;
}

export const RoundView: React.FC<RoundViewProps> = ({ round }) => {
  const { teams, roundNames, resetRound, title } = useStore();
  const [search, setSearch] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [popupAnchor, setPopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const filtered = useMemo(
    () => teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [teams, search]
  );

  const totalInRound = useMemo(
    () => teams.reduce((sum, t) => sum + t.scores[round], 0),
    [teams, round]
  );

  const handleTeamClick = useCallback((teamId: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopupAnchor({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
    setSelectedTeamId(teamId);
  }, []);

  const closePopup = useCallback(() => {
    setSelectedTeamId(null);
    setPopupAnchor(null);
  }, []);

  const handleResetConfirm = useCallback(() => {
    resetRound(round);
    setShowResetConfirm(false);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#e0e7ff'],
      gravity: 0.8,
    });
  }, [resetRound, round]);

  return (
    <div className="view-root">
      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="toolbar-left">
          <h2 className="view-title">{roundNames[round]}</h2>
          <span className="toolbar-stat">
            <Users className="w-3 h-3" />
            {filtered.length} teams · {totalInRound} pts total
          </span>
        </div>
        <div className="toolbar-actions">
          <button
            id={`reset-round-btn-${round}`}
            onClick={() => setShowResetConfirm(true)}
            className="btn-danger"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Round</span>
          </button>
          <div className="toolbar-divider" />
          <button onClick={() => exportToExcel(title, teams, roundNames)} className="btn-secondary" title="Export to Excel">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button onClick={() => exportToPDF(title, teams, roundNames)} className="btn-secondary" title="Export to PDF">
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button onClick={() => printScoreboard(title, teams, roundNames)} className="btn-secondary" title="Print">
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* ── Search + count ── */}
      <div className="search-strip">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {/* ── Team grid ── */}
      <div className="teams-scroll">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <p>No teams match "<strong>{search}</strong>"</p>
          </div>
        ) : (
          <div className="team-grid">
            {filtered.map((team, i) => (
              <TeamCard
                key={team.id}
                team={team}
                round={round}
                onClick={(e) => handleTeamClick(team.id, e)}
                isSelected={selectedTeamId === team.id}
                animDelay={i * 20}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Score Popup ── */}
      {selectedTeamId && popupAnchor && (
        <ScorePopup
          teamId={selectedTeamId}
          round={round}
          anchor={popupAnchor}
          onClose={closePopup}
        />
      )}

      {/* ── Reset Confirmation Modal ── */}
      {showResetConfirm && (
        <div className="modal-backdrop" onClick={() => setShowResetConfirm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-row">
              <div className="modal-icon-wrap modal-icon-warning">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="modal-title">Reset Round?</h3>
                <p className="modal-body">
                  All scores for <strong>{roundNames[round]}</strong> will be reset to&nbsp;0.
                  Each team's Undo button can restore their score.
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowResetConfirm(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleResetConfirm} className="btn-danger">Reset All Scores</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
