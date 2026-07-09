import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { sound } from '../utils/sound';
import { TeamCard } from './TeamCard';
import { SearchBar } from './SearchBar';
import { ScorePopup } from './ScorePopup';
import {
  AlertTriangle, RotateCcw, Download, FileText, Printer, Users,
  Grid, Table, Settings, Plus, ArrowUp, ArrowDown, Trash2, X, FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { exportToExcel, exportToPDF, exportToCSV, printScoreboard } from '../utils/export';
import confetti from 'canvas-confetti';

interface RoundViewProps {
  round: number;
  isFullscreen: boolean;
  onFullscreen: () => void;
}

export const RoundView: React.FC<RoundViewProps> = ({ round }) => {
  const {
    teams, roundNames, resetRound, title, roundQuestions,
    addQuestion, deleteQuestion, renameQuestion, reorderQuestions,
    activeQuestionIndex, setActiveQuestionIndex, excelTemplate,
    assignZerosToUnansweredTeams
  } = useStore();

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'quick' | 'sheet'>('quick');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [popupAnchor, setPopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showQuestionMgr, setShowQuestionMgr] = useState(false);
  const [newQuestionName, setNewQuestionName] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showUnansweredConfirm, setShowUnansweredConfirm] = useState(false);

  const questions = useMemo(() => roundQuestions[round] || [], [roundQuestions, round]);
  const activeQIdx = activeQuestionIndex[round] ?? 0;
  const activeQuestion = questions[activeQIdx] || questions[0];

  // Filter non-hidden teams
  const activeTeams = useMemo(() => teams.filter((t) => !t.isHidden), [teams]);

  // Compute number of teams completed for the current global question
  const completedCount = useMemo(() => {
    const qId = activeQuestion?.id;
    if (!qId) return 0;
    return activeTeams.filter((t) => t.scores[round]?.[qId] !== undefined).length;
  }, [activeTeams, round, activeQuestion, teams]);

  const handleNextQuestion = () => {
    const qId = activeQuestion?.id;
    if (!qId) return;

    // Check if there are pending teams
    const pendingCount = activeTeams.length - completedCount;
    if (pendingCount > 0) {
      setShowUnansweredConfirm(true);
      sound.playClick();
    } else {
      // Go to next question directly
      const nextQ = activeQIdx + 1;
      if (nextQ < questions.length) {
        setActiveQuestionIndex(round, nextQ);
        sound.playDing();
      }
    }
  };

  const confirmAssignZerosAndNext = () => {
    const qId = activeQuestion?.id;
    if (!qId) return;

    // Call store action to batch-assign 0s to unanswered active teams
    assignZerosToUnansweredTeams(round, qId);

    // Close confirmation dialog
    setShowUnansweredConfirm(false);

    // Advance to next question
    const nextQ = activeQIdx + 1;
    if (nextQ < questions.length) {
      setActiveQuestionIndex(round, nextQ);
      sound.playDing();
    }
  };

  // Apply search filtering
  const filteredTeams = useMemo(
    () => activeTeams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [activeTeams, search]
  );

  const totalInRound = useMemo(() => {
    return activeTeams.reduce((sum, t) => {
      const qScores = t.scores[round] || {};
      return sum + Object.values(qScores).reduce((a, b) => a + b, 0);
    }, 0);
  }, [activeTeams, round]);

  const handleTeamClick = useCallback((teamId: string, qId: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopupAnchor({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
    setSelectedTeamId(teamId);
    setSelectedQuestionId(qId);
    sound.playClick();
  }, []);

  const closePopup = useCallback(() => {
    setSelectedTeamId(null);
    setSelectedQuestionId(null);
    setPopupAnchor(null);
  }, []);

  const handleResetConfirm = useCallback(() => {
    resetRound(round);
    setShowResetConfirm(false);
    sound.playBuzz();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#3b82f6', '#10b981', '#f59e0b'],
      gravity: 0.8,
    });
  }, [resetRound, round]);

  // Question Actions
  const handleAddQuestion = () => {
    const name = newQuestionName.trim();
    addQuestion(round, name || `Q${questions.length + 1}`);
    setNewQuestionName('');
    sound.playClick();
  };

  const handleDeleteQuestion = (qId: string) => {
    if (questions.length <= 1) {
      alert("At least one question is required per round.");
      return;
    }
    if (window.confirm("Permanently delete this question? Cell scores for this question will be cleared.")) {
      deleteQuestion(round, qId);
      sound.playBuzz();
    }
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const nextList = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < nextList.length) {
      const temp = nextList[index];
      nextList[index] = nextList[targetIndex];
      nextList[targetIndex] = temp;
      reorderQuestions(round, nextList);
      
      // Update active question pointer if it was moved
      if (activeQIdx === index) {
        setActiveQuestionIndex(round, targetIndex);
      } else if (activeQIdx === targetIndex) {
        setActiveQuestionIndex(round, index);
      }
      sound.playClick();
    }
  };

  return (
    <div className="view-root">
      {/* ── Toolbar ── */}
      <div className="toolbar" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-soft)' }}>
        <div className="toolbar-left">
          <h2 className="view-title" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
            {roundNames[round]}
          </h2>
          <span className="toolbar-stat" style={{ color: 'var(--text-tertiary)' }}>
            <Users className="w-3.5 h-3.5" />
            {filteredTeams.length} / {activeTeams.length} teams · {totalInRound} pts total
          </span>
        </div>

        <div className="toolbar-actions">
          
          {/* Question Manager Toggle */}
          <div className="relative">
            <button
              onClick={() => { setShowQuestionMgr(!showQuestionMgr); sound.playClick(); }}
              className={`btn-secondary flex items-center gap-1.5 ${showQuestionMgr ? 'ring-2 ring-amber-400 bg-white/10' : ''}`}
              title="Manage questions for this round"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Questions ({questions.length})</span>
            </button>
            {showQuestionMgr && (
              <div
                className="absolute right-0 top-11 z-50 w-72 p-4 rounded-xl shadow-2xl border"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }}
              >
                <div className="flex items-center justify-between border-b pb-2 mb-3" style={{ borderColor: 'var(--border-soft)' }}>
                  <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Questions Editor</h4>
                  <button onClick={() => { setShowQuestionMgr(false); sound.playClick(); }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Question List */}
                <div className="max-h-56 overflow-y-auto mb-3 pr-1 flex flex-col gap-1.5 scrollbar-thin">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="flex items-center gap-1 bg-white/5 p-1.5 rounded border" style={{ borderColor: 'var(--border-soft)' }}>
                      <input
                        value={q.name}
                        onChange={(e) => renameQuestion(round, q.id, e.target.value)}
                        className="text-xs font-semibold bg-transparent outline-none border-b border-transparent focus:border-indigo-400 w-28 text-left"
                        style={{ color: 'var(--text-primary)' }}
                      />
                      
                      <div className="flex items-center gap-0.5 ml-auto">
                        <button
                          onClick={() => handleMoveQuestion(idx, 'up')}
                          disabled={idx === 0}
                          className="p-0.5 text-gray-400 hover:text-gray-200 disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveQuestion(idx, 'down')}
                          disabled={idx === questions.length - 1}
                          className="p-0.5 text-gray-400 hover:text-gray-200 disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-0.5 text-red-400 hover:text-red-600 ml-1"
                          title="Delete question"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Question footer */}
                <div className="flex gap-1.5 mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                  <input
                    value={newQuestionName}
                    onChange={(e) => setNewQuestionName(e.target.value)}
                    placeholder="New question..."
                    className="flex-1 min-w-0 bg-transparent border rounded px-2 py-1 text-xs outline-none"
                    style={{ borderColor: 'var(--border-soft)', color: 'var(--text-primary)' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                  />
                  <button
                    onClick={handleAddQuestion}
                    className="bg-indigo-600 text-white rounded p-1 flex items-center justify-center hover:bg-indigo-500"
                    style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="toolbar-divider" style={{ background: 'var(--border-soft)' }} />

          {/* Mode Selector */}
          <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10" style={{ borderColor: 'var(--border-soft)' }}>
            <button
              onClick={() => { setViewMode('quick'); sound.playClick(); }}
              className={`p-1.5 rounded flex items-center gap-1.5 text-xs font-semibold transition-all ${
                viewMode === 'quick' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
              style={{ background: viewMode === 'quick' ? 'var(--accent)' : 'transparent', color: viewMode === 'quick' ? 'var(--text-on-accent)' : '' }}
              title="Quick Tap Scoring Mode"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Quick Tap</span>
            </button>
            <button
              onClick={() => { setViewMode('sheet'); sound.playClick(); }}
              className={`p-1.5 rounded flex items-center gap-1.5 text-xs font-semibold transition-all ${
                viewMode === 'sheet' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
              style={{ background: viewMode === 'sheet' ? 'var(--accent)' : 'transparent', color: viewMode === 'sheet' ? 'var(--text-on-accent)' : '' }}
              title="Digital Score Sheet Mode"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Score Sheet</span>
            </button>
          </div>

          <div className="toolbar-divider" style={{ background: 'var(--border-soft)' }} />

             {/* Settings Dropdown */}
             <div className="relative">
               <button
                 onClick={() => { setShowSettingsMenu(!showSettingsMenu); setShowExportMenu(false); sound.playClick(); }}
                 className={`btn-secondary flex items-center gap-1.5 ${showSettingsMenu ? 'ring-2 ring-amber-400 bg-white/10' : ''}`}
                 title="Round settings and administration"
               >
                 <Settings className="w-3.5 h-3.5" />
                 <span>Settings</span>
                 <ChevronDown className="w-3 h-3 opacity-60" />
               </button>
               {showSettingsMenu && (
                 <>
                   <div className="fixed inset-0 z-40" onClick={() => setShowSettingsMenu(false)} />
                   <div
                     className="absolute right-0 top-11 z-50 w-52 py-1.5 rounded-xl shadow-2xl border flex flex-col"
                     style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}
                   >
                     <button
                       onClick={() => {
                         setShowSettingsMenu(false);
                         setShowResetConfirm(true);
                         sound.playClick();
                       }}
                       className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors text-left border-none bg-transparent w-full"
                     >
                       <RotateCcw className="w-3.5 h-3.5" />
                       Reset Round Scores
                     </button>
                   </div>
                 </>
               )}
             </div>

             <div className="toolbar-divider" style={{ background: 'var(--border-soft)' }} />

             {/* Export Dropdown */}
             <div className="relative">
               <button
                 onClick={() => { setShowExportMenu(!showExportMenu); setShowSettingsMenu(false); sound.playClick(); }}
                 className={`btn-secondary flex items-center gap-1.5 ${showExportMenu ? 'ring-2 ring-amber-400 bg-white/10' : ''}`}
                 title="Export results"
               >
                 <Download className="w-3.5 h-3.5 text-sky-400" />
                 <span>Export</span>
                 <ChevronDown className="w-3 h-3 opacity-60" />
               </button>
               {showExportMenu && (
                 <>
                   <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                   <div
                     className="absolute right-0 top-11 z-50 w-44 py-1.5 rounded-xl shadow-2xl border flex flex-col"
                     style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}
                   >
                     <button
                       onClick={() => {
                         setShowExportMenu(false);
                         exportToExcel(title, teams, roundNames, roundQuestions, excelTemplate);
                         sound.playClick();
                       }}
                       className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 transition-colors text-left border-none bg-transparent w-full"
                     >
                       <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                       Excel (.xlsx)
                     </button>
                     <button
                       onClick={() => {
                         setShowExportMenu(false);
                         exportToPDF(title, teams, roundNames);
                         sound.playClick();
                       }}
                       className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 transition-colors text-left border-none bg-transparent w-full"
                     >
                       <FileText className="w-3.5 h-3.5 text-red-400" />
                       PDF Document
                     </button>
                     <button
                       onClick={() => {
                         setShowExportMenu(false);
                         exportToCSV(title, teams, roundNames);
                         sound.playClick();
                       }}
                       className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 transition-colors text-left border-none bg-transparent w-full"
                     >
                       <Download className="w-3.5 h-3.5 text-sky-400" />
                       CSV Document
                     </button>
                     <button
                       onClick={() => {
                         setShowExportMenu(false);
                         printScoreboard(title, teams, roundNames, roundQuestions, round, excelTemplate);
                         sound.playClick();
                       }}
                       className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 transition-colors text-left border-none bg-transparent w-full"
                     >
                       <Printer className="w-3.5 h-3.5 text-indigo-400" style={{ color: 'var(--accent)' }} />
                       Print View
                     </button>
                   </div>
                 </>
               )}
             </div>
        </div>
      </div>

      {/* ── New Global Question Flow Banner (Scorer view) ── */}
      {viewMode === 'quick' && questions.length > 0 && (
        <div className="bg-white/5 border-b p-5 flex flex-col items-center justify-center text-center gap-2.5" style={{ borderColor: 'var(--border-soft)' }}>
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">Current Question</span>
          
          <div className="flex items-center gap-6">
            {/* Previous button */}
            <button
              disabled={activeQIdx === 0}
              onClick={() => { setActiveQuestionIndex(round, activeQIdx - 1); sound.playClick(); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                activeQIdx === 0
                  ? 'opacity-30 border-transparent text-gray-600 cursor-not-allowed'
                  : 'border-white/10 hover:bg-white/5 text-slate-200 cursor-pointer'
              }`}
            >
              ◀ Previous
            </button>

            {/* Question index label */}
            <span className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
              {activeQuestion?.name || `Q${activeQIdx + 1}`} <span className="text-slate-500 font-medium text-sm">/ {questions.length}</span>
            </span>

            {/* Next button */}
            <button
              disabled={activeQIdx >= questions.length - 1}
              onClick={() => { handleNextQuestion(); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                activeQIdx >= questions.length - 1
                  ? 'opacity-30 border-transparent text-gray-600 cursor-not-allowed'
                  : 'border-white/10 hover:bg-white/5 text-slate-200 cursor-pointer'
              }`}
            >
              Next ▶
            </button>
          </div>

          {/* Progress numbers */}
          <div className="text-xs font-semibold text-slate-400 mt-1">
            {completedCount === activeTeams.length ? (
              <span className="text-green-400 font-extrabold flex items-center justify-center gap-1">
                ✅ Question Completed
              </span>
            ) : (
              <span>
                Completed: <strong className="text-slate-200">{completedCount}</strong> / {activeTeams.length} Teams
                <span className="mx-2">·</span>
                Remaining: <strong className="text-amber-400 font-black">{activeTeams.length - completedCount}</strong> Teams
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-lg bg-black/40 rounded-full h-2 overflow-hidden border border-white/5 relative mt-1">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${(completedCount / activeTeams.length) * 100}%`,
                background: completedCount === activeTeams.length ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--grad-accent, linear-gradient(135deg, #fbbf24 0%, #d97706 100%))'
              }}
            />
          </div>
        </div>
      )}

      {/* ── Search strip ── */}
      <div className="search-strip py-3 px-5 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-soft)' }}>
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {/* ── Main display grid / sheet ── */}
      <div className="flex-1 overflow-hidden relative">
        {filteredTeams.length === 0 ? (
          <div className="empty-state h-full flex flex-col items-center justify-center p-8">
            <span className="empty-icon text-4xl mb-2">🔍</span>
            <p className="text-gray-400">No teams match "<strong>{search}</strong>"</p>
          </div>
        ) : viewMode === 'quick' ? (
          /* QUICK TAP MODE */
          <div className="teams-scroll h-full overflow-y-auto p-5 pb-24">
            <div className="team-grid">
              {filteredTeams.map((team, i) => {
                const totalScore = Object.values(team.scores[round] || {}).reduce((a, b) => a + b, 0);
                const qScore = team.scores[round]?.[activeQuestion?.id]; // Can be undefined (pending) or number

                return (
                  <TeamCard
                    key={team.id}
                    team={team}
                    qScore={qScore}
                    totalScore={totalScore}
                    qName={activeQuestion?.name || 'Q1'}
                    onClick={(e) => handleTeamClick(team.id, activeQuestion?.id, e)}
                    isSelected={selectedTeamId === team.id && selectedQuestionId === activeQuestion?.id}
                    animDelay={i * 15}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          /* SCORE SHEET MODE (GRID LAYOUT) */
          <div className="h-full overflow-auto p-5 scrollbar-thin">
            <div
              className="border rounded-xl shadow-lg overflow-x-auto max-w-full"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}
            >
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '2px solid var(--border-strong)' }}>
                    <th className="p-3 font-bold text-xs uppercase tracking-wider text-center sticky left-0 z-20 border-r" style={{ width: 120, background: 'var(--bg-subtle)', color: 'var(--text-primary)', borderColor: 'var(--border-strong)' }}>
                      Questions
                    </th>
                    {filteredTeams.map((t) => (
                      <th
                        key={t.id}
                        className="p-3 font-bold text-xs uppercase tracking-wider text-center border-r"
                        style={{
                          minWidth: 90,
                          color: t.color,
                          borderColor: 'var(--border-soft)',
                          borderTop: `3px solid ${t.color}`
                        }}
                      >
                        {t.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr
                      key={q.id}
                      className="hover:bg-white/5 border-b transition-colors"
                      style={{ borderColor: 'var(--border-soft)' }}
                    >
                      {/* Left Header for Question */}
                      <td
                        className="p-3 text-xs font-bold text-center sticky left-0 border-r font-mono"
                        style={{
                          background: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border-strong)',
                          boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
                        }}
                      >
                        {q.name}
                      </td>

                      {/* Team Scores for this Question */}
                      {filteredTeams.map((t) => {
                        const score = t.scores[round]?.[q.id] ?? 0;
                        const isCellSelected = selectedTeamId === t.id && selectedQuestionId === q.id;
                        return (
                          <td
                            key={t.id}
                            onClick={(e) => handleTeamClick(t.id, q.id, e)}
                            className={`p-3 text-center border-r font-mono text-sm cursor-pointer transition-all hover:bg-white/10 ${
                              isCellSelected ? 'bg-amber-500/20 ring-2 ring-amber-400 ring-inset font-black' : ''
                            }`}
                            style={{ borderColor: 'var(--border-soft)' }}
                          >
                            <span className={score > 0 ? 'font-bold' : 'text-gray-500'}>
                              {score}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* BOTTOM ROW: ROUND TOTAL */}
                  <tr
                    className="font-bold border-t-2"
                    style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-strong)' }}
                  >
                    <td
                      className="p-3 text-xs uppercase tracking-wider text-center sticky left-0 border-r font-black"
                      style={{
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-strong)'
                      }}
                    >
                      Round Total
                    </td>
                    {filteredTeams.map((t) => {
                      const roundTotal = Object.values(t.scores[round] || {}).reduce((a, b) => a + b, 0);
                      return (
                        <td
                          key={t.id}
                          className="p-3 text-center border-r font-mono text-base font-black text-indigo-600"
                          style={{ borderColor: 'var(--border-soft)', color: 'var(--accent)' }}
                        >
                          {roundTotal}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Score Popup ── */}
      {selectedTeamId && selectedQuestionId && popupAnchor && (
        <ScorePopup
          teamId={selectedTeamId}
          round={round}
          questionId={selectedQuestionId}
          anchor={popupAnchor}
          onClose={closePopup}
        />
      )}

      {/* ── Reset Confirmation Modal ── */}
      {showResetConfirm && (
        <div className="modal-backdrop" onClick={() => { setShowResetConfirm(false); sound.playClick(); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>
            <div className="modal-icon-row">
              <div className="modal-icon-wrap modal-icon-warning" style={{ background: 'rgba(245,158,11,0.1)' }}>
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="modal-title" style={{ color: 'var(--text-primary)' }}>Reset Round Scores?</h3>
                <p className="modal-body" style={{ color: 'var(--text-secondary)' }}>
                  All scores for <strong>{roundNames[round]}</strong> will be reset to 0 for all teams.
                  This action is added to undo history.
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => { setShowResetConfirm(false); sound.playClick(); }} className="btn-secondary">Cancel</button>
              <button onClick={handleResetConfirm} className="btn-danger">Reset All Scores</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unanswered Teams Confirmation Modal ── */}
      {showUnansweredConfirm && (
        <div className="modal-backdrop" onClick={() => { setShowUnansweredConfirm(false); sound.playClick(); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', maxWidth: '440px' }}>
            <div className="modal-icon-row">
              <div className="modal-icon-wrap modal-icon-warning" style={{ background: 'rgba(245,158,11,0.1)' }}>
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="modal-title text-amber-400" style={{ color: 'var(--text-primary)' }}>Unanswered Teams</h3>
                <div className="modal-body mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <p>Some teams have not been scored for this question.</p>
                  <p className="mt-1 font-black text-amber-400 text-base">Remaining Teams: {activeTeams.length - completedCount}</p>
                  <p className="mt-3">If you continue, all unanswered teams will automatically be assigned <strong className="text-white">0 points</strong> for this question.</p>
                  <p className="mt-2 text-gray-400 text-xs font-semibold">These scores can be edited later at any time.</p>
                </div>
              </div>
            </div>
            <div className="modal-actions mt-5">
              <button onClick={() => { setShowUnansweredConfirm(false); sound.playClick(); }} className="btn-secondary">
                Cancel
              </button>
              <button onClick={confirmAssignZerosAndNext} className="btn-danger bg-amber-500 hover:bg-amber-600 border-amber-600 text-slate-900 font-extrabold px-5">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Next Question Bottom Panel ── */}
      {viewMode === 'quick' && questions.length > 0 && activeQIdx < questions.length - 1 && (
        <div
          className="sticky bottom-0 left-0 w-full p-4 border-t flex justify-center items-center backdrop-blur shadow-2xl z-30 animate-fade-in"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-strong)',
            boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.3)'
          }}
        >
          <button
            disabled={activeQIdx >= questions.length - 1}
            onClick={() => { handleNextQuestion(); }}
            className={`px-10 py-3 rounded-full font-black text-sm uppercase tracking-widest flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 border cursor-pointer ${
              completedCount === activeTeams.length
                ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] scale-105 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
            style={{
              background: completedCount === activeTeams.length ? 'var(--accent)' : '',
              color: completedCount === activeTeams.length ? 'var(--text-on-accent)' : ''
            }}
          >
            <span>▶ Next Question</span>
          </button>
        </div>
      )}
    </div>
  );
};
