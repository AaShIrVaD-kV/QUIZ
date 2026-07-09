import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const TEAM_NAMES = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W'];
const DEFAULT_ROUND_NAMES = [
  'CHODIKAM PARAYAM',
  'SAMVADAM',
  'KANISHAM',
  'NERVAZHI',
  'Visual Round'
];

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald Green
  '#ef4444', // Crimson Red
  '#f59e0b', // Amber Yellow
  '#8b5cf6', // Violet
  '#ec4899', // Rose Pink
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#64748b'  // Slate Gray
];

export interface Question {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  isHidden: boolean;
  scores: {
    [roundIndex: number]: {
      [questionId: string]: number;
    };
  };
}

export interface Snapshot {
  title: string;
  roundNames: string[];
  teams: Team[];
  roundQuestions: { [roundIndex: number]: Question[] };
  activeQuestionIndex: { [roundIndex: number]: number };
  teamActiveQuestions: { [teamId: string]: { [roundIndex: number]: number } };
  autoAdvance: boolean;
}

export interface StoreState {
  // Data
  title: string;
  roundNames: string[];
  teams: Team[];
  roundQuestions: { [roundIndex: number]: Question[] };
  activeTab: number;
  activeQuestionIndex: { [roundIndex: number]: number };
  teamActiveQuestions: { [teamId: string]: { [roundIndex: number]: number } };
  autoAdvance: boolean;
  theme: 'light' | 'dark' | 'quiz';
  displayMode: 'scorer' | 'projector';
  excelTemplate: string | null; // Base64 XLS/XLSX template

  // Undo/Redo history
  past: Snapshot[];
  future: Snapshot[];

  // Core Actions
  setTitle: (title: string) => void;
  setRoundName: (index: number, name: string) => void;
  resetRoundNames: () => void;
  setActiveTab: (tab: number) => void;
  setActiveQuestionIndex: (roundIndex: number, index: number) => void;
  setTeamActiveQuestion: (teamId: string, roundIndex: number, questionIndex: number) => void;
  setAutoAdvance: (val: boolean) => void;
  advanceRoundQuestion: (roundIndex: number) => void;
  setTheme: (theme: 'light' | 'dark' | 'quiz') => void;
  setDisplayMode: (mode: 'scorer' | 'projector') => void;
  setExcelTemplate: (base64: string | null) => void;

  // Scoring Actions
  setScore: (teamId: string, roundIndex: number, questionId: string, score: number) => void;
  addScore: (teamId: string, roundIndex: number, questionId: string, delta: number) => void;
  clearTeamQuestionScore: (teamId: string, roundIndex: number, questionId: string) => void;
  assignZerosToUnansweredTeams: (roundIndex: number, questionId: string) => void;
  resetTeamRoundScore: (teamId: string, roundIndex: number) => void;
  resetTeamScore: (teamId: string) => void;

  // Team Management
  addTeam: (name: string, color?: string) => void;
  removeTeam: (teamId: string) => void;
  renameTeam: (teamId: string, name: string) => void;
  setTeamColor: (teamId: string, color: string) => void;
  setTeamHidden: (teamId: string, isHidden: boolean) => void;

  // Question Management
  addQuestion: (roundIndex: number, name: string) => void;
  deleteQuestion: (roundIndex: number, questionId: string) => void;
  renameQuestion: (roundIndex: number, questionId: string, name: string) => void;
  reorderQuestions: (roundIndex: number, questions: Question[]) => void;

  // Global Controls
  resetRound: (roundIndex: number) => void;
  resetAll: () => void; // Reset entire competition scores

  // History Operations
  undo: () => void;
  redo: () => void;
}

const createDefaultQuestions = (count: number): Question[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `q-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: `Q${i + 1}`
  }));

const createInitialRoundQuestions = () => ({
  0: createDefaultQuestions(10), // CHODIKAM PARAYAM
  1: createDefaultQuestions(5),  // SAMVADAM
  2: createDefaultQuestions(4),  // KANISHAM
  3: createDefaultQuestions(10), // NERVAZHI
  4: createDefaultQuestions(5)   // Visual Round
});

const createTeam = (name: string, id: string, index: number): Team => ({
  id,
  name,
  color: PRESET_COLORS[index % PRESET_COLORS.length],
  isHidden: false,
  scores: {
    0: {}, 1: {}, 2: {}, 3: {}, 4: {}
  }
});

const createTeams = (): Team[] =>
  TEAM_NAMES.map((name, i) => createTeam(name, `team-${i}`, i));

const createInitialTeamActiveQuestions = () => {
  const map: { [teamId: string]: { [roundIndex: number]: number } } = {};
  TEAM_NAMES.forEach((_, i) => {
    map[`team-${i}`] = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  });
  return map;
};

const makeSnapshot = (state: StoreState): Snapshot => ({
  title: state.title,
  roundNames: [...state.roundNames],
  teams: JSON.parse(JSON.stringify(state.teams)),
  roundQuestions: JSON.parse(JSON.stringify(state.roundQuestions)),
  activeQuestionIndex: { ...state.activeQuestionIndex },
  teamActiveQuestions: JSON.parse(JSON.stringify(state.teamActiveQuestions || {})),
  autoAdvance: state.autoAdvance
});

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      title: 'Quiz Competition',
      roundNames: [...DEFAULT_ROUND_NAMES],
      teams: createTeams(),
      roundQuestions: createInitialRoundQuestions(),
      activeTab: 0,
      activeQuestionIndex: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
      teamActiveQuestions: createInitialTeamActiveQuestions(),
      autoAdvance: true,
      theme: 'quiz',
      displayMode: 'scorer',
      excelTemplate: null,

      past: [],
      future: [],

      // Core Actions
      setTitle: (title) => {
        const state = get();
        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          title
        });
      },

      setRoundName: (index, name) => {
        const state = get();
        const roundNames = [...state.roundNames];
        roundNames[index] = name;
        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          roundNames
        });
      },

      resetRoundNames: () => {
        const state = get();
        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          roundNames: [...DEFAULT_ROUND_NAMES]
        });
      },

      setActiveTab: (tab) => set({ activeTab: tab }),

      setActiveQuestionIndex: (roundIndex, index) => {
        set((state) => ({
          activeQuestionIndex: {
            ...state.activeQuestionIndex,
            [roundIndex]: index
          }
        }));
      },

      setTeamActiveQuestion: (teamId, roundIndex, questionIndex) => {
        set((state) => {
          const teamActiveQ = JSON.parse(JSON.stringify(state.teamActiveQuestions || {}));
          if (!teamActiveQ[teamId]) {
            teamActiveQ[teamId] = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
          }
          teamActiveQ[teamId][roundIndex] = questionIndex;
          return {
            teamActiveQuestions: teamActiveQ
          };
        });
      },

      setAutoAdvance: (val) => set({ autoAdvance: val }),

      advanceRoundQuestion: (roundIndex) => {
        const state = get();
        const activeQ = state.activeQuestionIndex[roundIndex] ?? 0;
        const totalQuestions = state.roundQuestions[roundIndex]?.length ?? 0;
        const nextQ = activeQ + 1;

        if (nextQ >= totalQuestions) return;

        const teamActiveQ = JSON.parse(JSON.stringify(state.teamActiveQuestions || {}));
        state.teams.forEach((t) => {
          if (!teamActiveQ[t.id]) {
            teamActiveQ[t.id] = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
          }
          const currentTeamQ = teamActiveQ[t.id][roundIndex] ?? 0;
          if (currentTeamQ === activeQ) {
            teamActiveQ[t.id][roundIndex] = nextQ;
          }
        });

        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          activeQuestionIndex: {
            ...state.activeQuestionIndex,
            [roundIndex]: nextQ
          },
          teamActiveQuestions: teamActiveQ
        });
      },

      setTheme: (theme) => set({ theme }),

      setDisplayMode: (displayMode) => set({ displayMode }),

      setExcelTemplate: (excelTemplate) => set({ excelTemplate }),

      // Scoring
      setScore: (teamId, roundIndex, questionId, score) => {
        const state = get();
        const nextTeams = state.teams.map((t) => {
          if (t.id !== teamId) return t;
          const scores = JSON.parse(JSON.stringify(t.scores));
          scores[roundIndex][questionId] = Math.max(0, score);
          return { ...t, scores };
        });

        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          teams: nextTeams
        });
      },

      addScore: (teamId, roundIndex, questionId, delta) => {
        const state = get();
        const nextTeams = state.teams.map((t) => {
          if (t.id !== teamId) return t;
          const scores = JSON.parse(JSON.stringify(t.scores));
          const current = scores[roundIndex][questionId] || 0;
          scores[roundIndex][questionId] = Math.max(0, current + delta);
          return { ...t, scores };
        });

        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          teams: nextTeams
        });
      },

      clearTeamQuestionScore: (teamId, roundIndex, questionId) => {
        const state = get();
        const nextTeams = state.teams.map((t) => {
          if (t.id !== teamId) return t;
          const scores = JSON.parse(JSON.stringify(t.scores));
          delete scores[roundIndex][questionId];
          return { ...t, scores };
        });

        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          teams: nextTeams
        });
      },

      assignZerosToUnansweredTeams: (roundIndex, questionId) => {
        const state = get();
        const activeTeamIds = state.teams.filter(t => !t.isHidden).map(t => t.id);
        const nextTeams = state.teams.map((t) => {
          if (!activeTeamIds.includes(t.id)) return t;
          if (t.scores[roundIndex]?.[questionId] !== undefined) return t;

          const scores = JSON.parse(JSON.stringify(t.scores));
          scores[roundIndex][questionId] = 0;
          return { ...t, scores };
        });

        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          teams: nextTeams
        });
      },

      resetTeamRoundScore: (teamId, roundIndex) => {
        const state = get();
        const nextTeams = state.teams.map((t) => {
          if (t.id !== teamId) return t;
          const scores = JSON.parse(JSON.stringify(t.scores));
          scores[roundIndex] = {};
          return { ...t, scores };
        });

        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          teams: nextTeams
        });
      },

      resetTeamScore: (teamId) => {
        const state = get();
        const nextTeams = state.teams.map((t) => {
          if (t.id !== teamId) return t;
          return {
            ...t,
            scores: { 0: {}, 1: {}, 2: {}, 3: {}, 4: {} }
          };
        });

        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          teams: nextTeams
        });
      },

      // Team Management
      addTeam: (name, color) => {
        const state = get();
        const id = `team-${Date.now()}`;
        const newTeam = createTeam(
          name.trim() || `Team ${state.teams.length + 1}`,
          id,
          state.teams.length
        );
        if (color) newTeam.color = color;

        const nextTeamActiveQ = JSON.parse(JSON.stringify(state.teamActiveQuestions || {}));
        nextTeamActiveQ[id] = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };

        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          teams: [...state.teams, newTeam],
          teamActiveQuestions: nextTeamActiveQ
        });
      },

      removeTeam: (teamId) => {
        const state = get();
        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          teams: state.teams.filter((t) => t.id !== teamId)
        });
      },

      renameTeam: (teamId, name) => {
        const state = get();
        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          teams: state.teams.map((t) => (t.id === teamId ? { ...t, name } : t))
        });
      },

      setTeamColor: (teamId, color) => {
        const state = get();
        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          teams: state.teams.map((t) => (t.id === teamId ? { ...t, color } : t))
        });
      },

      setTeamHidden: (teamId, isHidden) => {
        const state = get();
        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          teams: state.teams.map((t) => (t.id === teamId ? { ...t, isHidden } : t))
        });
      },

      // Question Management
      addQuestion: (roundIndex, name) => {
        const state = get();
        const id = `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const qList = [...(state.roundQuestions[roundIndex] || [])];
        qList.push({ id, name: name.trim() || `Q${qList.length + 1}` });

        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          roundQuestions: {
            ...state.roundQuestions,
            [roundIndex]: qList
          }
        });
      },

      deleteQuestion: (roundIndex, questionId) => {
        const state = get();
        const qList = (state.roundQuestions[roundIndex] || []).filter((q) => q.id !== questionId);
        
        // Clean scores of this question from all teams
        const nextTeams = state.teams.map((t) => {
          const scores = JSON.parse(JSON.stringify(t.scores));
          delete scores[roundIndex][questionId];
          return { ...t, scores };
        });

        // Shift active index if out of bounds
        const currentActive = state.activeQuestionIndex[roundIndex] || 0;
        const nextActive = Math.max(0, Math.min(qList.length - 1, currentActive));

        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          roundQuestions: {
            ...state.roundQuestions,
            [roundIndex]: qList
          },
          teams: nextTeams,
          activeQuestionIndex: {
            ...state.activeQuestionIndex,
            [roundIndex]: nextActive
          }
        });
      },

      renameQuestion: (roundIndex, questionId, name) => {
        const state = get();
        const qList = (state.roundQuestions[roundIndex] || []).map((q) =>
          q.id === questionId ? { ...q, name: name.trim() || q.name } : q
        );

        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          roundQuestions: {
            ...state.roundQuestions,
            [roundIndex]: qList
          }
        });
      },

      reorderQuestions: (roundIndex, questions) => {
        const state = get();
        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          roundQuestions: {
            ...state.roundQuestions,
            [roundIndex]: questions
          }
        });
      },

      // Global Reset controls
      resetRound: (roundIndex) => {
        const state = get();
        const nextTeams = state.teams.map((t) => {
          const scores = JSON.parse(JSON.stringify(t.scores));
          scores[roundIndex] = {};
          return { ...t, scores };
        });

        const nextTeamActiveQ = JSON.parse(JSON.stringify(state.teamActiveQuestions || {}));
        state.teams.forEach((t) => {
          if (!nextTeamActiveQ[t.id]) {
            nextTeamActiveQ[t.id] = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
          }
          nextTeamActiveQ[t.id][roundIndex] = 0;
        });

        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          teams: nextTeams,
          activeQuestionIndex: {
            ...state.activeQuestionIndex,
            [roundIndex]: 0
          },
          teamActiveQuestions: nextTeamActiveQ
        });
      },

      resetAll: () => {
        const state = get();
        const nextTeams = state.teams.map((t) => ({
          ...t,
          scores: { 0: {}, 1: {}, 2: {}, 3: {}, 4: {} }
        }));

        const nextTeamActiveQ = JSON.parse(JSON.stringify(state.teamActiveQuestions || {}));
        state.teams.forEach((t) => {
          nextTeamActiveQ[t.id] = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
        });

        set({
          past: [...state.past, makeSnapshot(state)].slice(-30),
          future: [],
          teams: nextTeams,
          activeQuestionIndex: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
          teamActiveQuestions: nextTeamActiveQ
        });
      },

      // Undo/Redo
      undo: () => {
        const state = get();
        if (state.past.length === 0) return;

        const previous = state.past[state.past.length - 1];
        const nextPast = state.past.slice(0, state.past.length - 1);
        const current = makeSnapshot(state);

        set({
          past: nextPast,
          future: [...state.future, current],
          title: previous.title,
          roundNames: previous.roundNames,
          teams: previous.teams,
          roundQuestions: previous.roundQuestions,
          activeQuestionIndex: previous.activeQuestionIndex,
          teamActiveQuestions: previous.teamActiveQuestions,
          autoAdvance: previous.autoAdvance
        });
      },

      redo: () => {
        const state = get();
        if (state.future.length === 0) return;

        const next = state.future[state.future.length - 1];
        const nextFuture = state.future.slice(0, state.future.length - 1);
        const current = makeSnapshot(state);

        set({
          past: [...state.past, current],
          future: nextFuture,
          title: next.title,
          roundNames: next.roundNames,
          teams: next.teams,
          roundQuestions: next.roundQuestions,
          activeQuestionIndex: next.activeQuestionIndex,
          teamActiveQuestions: next.teamActiveQuestions,
          autoAdvance: next.autoAdvance
        });
      }
    }),
    {
      name: 'quiz-scoreboard-v4',
      partialize: (state) => ({
        title: state.title,
        roundNames: state.roundNames,
        teams: state.teams,
        roundQuestions: state.roundQuestions,
        activeTab: state.activeTab,
        activeQuestionIndex: state.activeQuestionIndex,
        teamActiveQuestions: state.teamActiveQuestions,
        autoAdvance: state.autoAdvance,
        theme: state.theme,
        displayMode: state.displayMode,
        excelTemplate: state.excelTemplate
      })
    }
  )
);
