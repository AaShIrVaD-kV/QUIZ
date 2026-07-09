import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { sound } from '../utils/sound';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Monitor } from 'lucide-react';
import confetti from 'canvas-confetti';

const PODIUM_ORDER = [1, 0, 2];

export const ProjectorView: React.FC = () => {
  const { title, teams, setDisplayMode } = useStore();
  const [filter, setFilter] = useState<'top3' | 'top5' | 'top10' | 'all'>('all');
  const prevLeaderIdRef = useRef<string | null>(null);
  const prevHighScoreRef = useRef<number>(0);

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

  // Apply filters
  const filtered = useMemo(() => {
    switch (filter) {
      case 'top3': return ranked.slice(0, 3);
      case 'top5': return ranked.slice(0, 5);
      case 'top10': return ranked.slice(0, 10);
      default: return ranked;
    }
  }, [ranked, filter]);

  const topThree = useMemo(() => ranked.slice(0, 3), [ranked]);

  // Smart Live Confetti: Fire when leader changes or high score increases!
  useEffect(() => {
    if (ranked.length === 0) return;
    const leader = ranked[0];
    const leaderId = leader.id;
    const leaderScore = leader.total;

    if (prevLeaderIdRef.current !== null && prevLeaderIdRef.current !== leaderId) {
      // New leader took over!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.4 },
        colors: [leader.color, '#fbbf24', '#f59e0b', '#ffffff'],
      });
      sound.playFanfare();
    } else if (prevHighScoreRef.current > 0 && leaderScore > prevHighScoreRef.current) {
      // Leader extended score!
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.4 },
        colors: [leader.color, '#cbd5e1', '#ffffff'],
      });
      sound.playDing();
    }

    prevLeaderIdRef.current = leaderId;
    prevHighScoreRef.current = leaderScore;
  }, [ranked]);

  return (
    <div
      className="projector-root fixed inset-0 z-[9999] flex flex-col p-6 md:p-10 select-none overflow-hidden"
      style={{
        background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
        color: '#ffffff'
      }}
    >
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b pb-6 mb-8 gap-4 border-slate-800">
        <div className="text-center md:text-left">
          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-500 flex items-center gap-1.5 justify-center md:justify-start">
            <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
            Live Competition Leaderboard
          </span>
          <h1 className="text-3xl md:text-5xl font-black mt-1 font-outfit tracking-tight text-yellow-100 drop-shadow-md">
            {title}
          </h1>
        </div>

        {/* Controls Overlay */}
        <div className="flex items-center gap-3 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
          {/* Filters */}
          <div className="flex items-center">
            {(['top3', 'top5', 'top10', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); sound.playClick(); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                  filter === f
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {f === 'all' ? 'All' : `Top ${f.replace('top', '')}`}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-800" />

          {/* Exit Button */}
          <button
            onClick={() => { setDisplayMode('scorer'); sound.playClick(); }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1 text-xs font-bold"
            title="Return to Scorer View"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* ── Main display grid ── */}
      <div className="flex-1 flex flex-col md:flex-row gap-8 items-stretch justify-center overflow-hidden">
        
        {/* Left: Huge Podium (Visible if filtering All/Top 3 and there are enough teams) */}
        {(filter === 'all' || filter === 'top3') && topThree.length >= 3 && (
          <div className="w-full md:w-[35%] flex flex-col items-center justify-center bg-slate-950/40 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Podium Standings
            </h3>
            
            <div className="flex items-end justify-center gap-4 w-full h-64 mt-4">
              {PODIUM_ORDER.map((idx) => {
                const team = topThree[idx];
                if (!team) return null;
                const rank = idx + 1; // 1=Gold, 2=Silver, 3=Bronze
                return (
                  <motion.div
                    key={team.id}
                    className="flex-1 flex flex-col justify-end items-center h-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: idx * 0.15, type: 'spring' }}
                  >
                    {/* Team tag floating */}
                    <div className="text-center mb-2 px-2 max-w-full">
                      <div className="text-xs font-black truncate text-yellow-100" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                        {team.name}
                      </div>
                      <div className="text-lg font-black font-mono mt-0.5" style={{ color: team.color }}>
                        {team.total}
                      </div>
                    </div>

                    {/* Pedestal block */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`w-full rounded-t-2xl shadow-xl flex flex-col items-center justify-start pt-3 border-t-4`}
                      style={{
                        height: rank === 1 ? '70%' : rank === 2 ? '50%' : '35%',
                        background: rank === 1 
                          ? 'linear-gradient(to bottom, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.05) 100%)'
                          : rank === 2
                            ? 'linear-gradient(to bottom, rgba(148,163,184,0.2) 0%, rgba(148,163,184,0.05) 100%)'
                            : 'linear-gradient(to bottom, rgba(192,123,53,0.2) 0%, rgba(192,123,53,0.05) 100%)',
                        borderColor: rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : '#c07b35',
                        borderTopColor: team.color
                      }}
                    >
                      <span className="text-3xl">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
                      <span className="text-[10px] font-black text-slate-400 mt-1 uppercase">Rank {rank}</span>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Right: Scrolling Leaderboard Table */}
        <div className="flex-1 flex flex-col bg-slate-950/20 rounded-3xl border border-slate-800/60 p-6 md:p-8 overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-800">
            <span className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Position Board</span>
            <span className="font-mono text-xs font-bold text-slate-500">Showing {filtered.length} Teams</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 scrollbar-thin">
            <AnimatePresence initial={false}>
              {filtered.map((team) => {
                const isGold = team.rank === 1;
                const isSilver = team.rank === 2;
                const isBronze = team.rank === 3;
                return (
                  <motion.div
                    layout
                    key={team.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 25 }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isGold ? 'border-amber-500/50 bg-amber-500/5 shadow-[0_0_15px_rgba(251,191,36,0.05)]'
                      : isSilver ? 'border-slate-500/40 bg-slate-500/5'
                      : isBronze ? 'border-orange-500/40 bg-orange-500/5'
                      : 'border-slate-800/80 bg-slate-900/20'
                    }`}
                    style={{
                      borderLeft: `5px solid ${team.color}`
                    }}
                  >
                    {/* Rank & Name */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 text-center font-mono font-black text-xl flex justify-center items-center">
                        {isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : `#${team.rank}`}
                      </div>
                      <div className="truncate">
                        <span className="text-lg md:text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                          {team.name}
                        </span>
                      </div>
                    </div>

                    {/* Grand Total */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-2xl md:text-3xl font-black font-mono" style={{ color: team.color }}>
                        {team.total}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">pts</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
};
