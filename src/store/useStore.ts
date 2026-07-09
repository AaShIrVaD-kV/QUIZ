import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const TEAM_NAMES = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W'];
const NUM_ROUNDS = 5;
const DEFAULT_ROUND_NAMES = ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5'];

export interface HistoryEntry {
  round: number;
  prev: number;
}

export interface Team {
  id: string;
  name: string;
  scores: number[];
  history: HistoryEntry[];
}

export interface StoreState {
  title: string;
  roundNames: string[];
  teams: Team[];
  activeTab: number;

  setTitle: (title: string) => void;
  setRoundName: (index: number, name: string) => void;
  resetRoundNames: () => void;
  setActiveTab: (tab: number) => void;
  addScore: (teamId: string, round: number, delta: number) => void;
  setScore: (teamId: string, round: number, value: number) => void;
  undoLastChange: (teamId: string) => void;
  resetTeamRoundScore: (teamId: string, round: number) => void;
  resetRound: (round: number) => void;
  resetAll: () => void;
  renameTeam: (teamId: string, name: string) => void;
  addTeam: (name: string) => void;
  removeTeam: (teamId: string) => void;
}

const createTeam = (name: string, id: string): Team => ({
  id,
  name,
  scores: Array(NUM_ROUNDS).fill(0),
  history: [],
});

const createTeams = (): Team[] =>
  TEAM_NAMES.map((name, i) => createTeam(name, `team-${i}`));

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      title: 'Quiz Competition',
      roundNames: [...DEFAULT_ROUND_NAMES],
      teams: createTeams(),
      activeTab: 0,

      setTitle: (title) => set({ title }),

      setRoundName: (index, name) =>
        set((state) => {
          const roundNames = [...state.roundNames];
          roundNames[index] = name;
          return { roundNames };
        }),

      resetRoundNames: () => set({ roundNames: [...DEFAULT_ROUND_NAMES] }),

      setActiveTab: (tab) => set({ activeTab: tab }),

      addTeam: (name) =>
        set((state) => {
          const id = `team-custom-${Date.now()}`;
          return { teams: [...state.teams, createTeam(name.trim() || `Team ${state.teams.length + 1}`, id)] };
        }),

      removeTeam: (teamId) =>
        set((state) => ({ teams: state.teams.filter((t) => t.id !== teamId) })),

      addScore: (teamId, round, delta) =>
        set((state) => ({
          teams: state.teams.map((t) => {
            if (t.id !== teamId) return t;
            const prev = t.scores[round];
            const scores = [...t.scores];
            scores[round] = Math.max(0, prev + delta);
            const history: HistoryEntry[] = [...t.history, { round, prev }].slice(-20);
            return { ...t, scores, history };
          }),
        })),

      setScore: (teamId, round, value) =>
        set((state) => ({
          teams: state.teams.map((t) => {
            if (t.id !== teamId) return t;
            const prev = t.scores[round];
            const scores = [...t.scores];
            scores[round] = Math.max(0, value);
            const history: HistoryEntry[] = [...t.history, { round, prev }].slice(-20);
            return { ...t, scores, history };
          }),
        })),

      undoLastChange: (teamId) =>
        set((state) => ({
          teams: state.teams.map((t) => {
            if (t.id !== teamId || t.history.length === 0) return t;
            const history = [...t.history];
            const last = history.pop()!;
            const scores = [...t.scores];
            scores[last.round] = last.prev;
            return { ...t, scores, history };
          }),
        })),

      resetTeamRoundScore: (teamId, round) =>
        set((state) => ({
          teams: state.teams.map((t) => {
            if (t.id !== teamId) return t;
            const prev = t.scores[round];
            const scores = [...t.scores];
            scores[round] = 0;
            const history: HistoryEntry[] = [...t.history, { round, prev }].slice(-20);
            return { ...t, scores, history };
          }),
        })),

      resetRound: (round) =>
        set((state) => ({
          teams: state.teams.map((t) => {
            const prev = t.scores[round];
            const scores = [...t.scores];
            scores[round] = 0;
            const history: HistoryEntry[] = [...t.history, { round, prev }].slice(-20);
            return { ...t, scores, history };
          }),
        })),

      resetAll: () =>
        set((state) => ({
          teams: state.teams.map((t) => ({
            ...t,
            scores: Array(NUM_ROUNDS).fill(0),
            history: [],
          })),
        })),

      renameTeam: (teamId, name) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId ? { ...t, name } : t
          ),
        })),
    }),
    { name: 'quiz-scoreboard-v2' }
  )
);
