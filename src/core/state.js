import {
  DEFAULT_GOALS,
  EXAM_DEFAULT,
  STORAGE_KEY,
  SUBJECTS,
  SUB_BY_ID,
  TAF_DATE_DEFAULT,
  TAF_EXERCISES,
  TAF_PRESETS,
} from './constants.js';
import { isISO, todayISO } from './dates.js';
import { tafKind, tafParse } from './taf.js';
import { clamp, round1, uid } from './utils.js';

export function emptyLog() {
  return { subjects: [], hours: 0, questions: 0, correct: 0, notes: '' };
}

export function defaultTaf() {
  return { date: TAF_DATE_DEFAULT, profile: 'm', targets: { ...TAF_PRESETS.m }, sessions: [] };
}

export function defaultState() {
  return {
    version: 3,
    name: 'Márcio',
    examDate: EXAM_DEFAULT,
    startDate: todayISO(),
    dailyGoal: 3,
    logs: {},
    plan: null,
    goals: { ...DEFAULT_GOALS },
    simulados: [],
    taf: defaultTaf(),
  };
}

export function sanitizeLog(raw) {
  const out = emptyLog();
  if (!raw || typeof raw !== 'object') return out;
  if (Array.isArray(raw.subjects)) {
    out.subjects = [...new Set(raw.subjects.filter((id) => SUB_BY_ID[id]))];
  }
  out.hours = round1(clamp(Number(raw.hours) || 0, 0, 24));
  out.questions = Math.max(0, Math.floor(Number(raw.questions) || 0));
  out.correct = clamp(Math.floor(Number(raw.correct) || 0), 0, out.questions);
  out.notes = typeof raw.notes === 'string' ? raw.notes.slice(0, 3000) : '';
  return out;
}

export function sanitizePlan(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!isISO(raw.startDate) || !isISO(raw.examDate) || !Array.isArray(raw.days)) return null;

  const seen = new Set();
  const days = [];
  for (const day of raw.days) {
    if (!day || !isISO(day.date) || !SUB_BY_ID[day.subject] || seen.has(day.date)) continue;
    seen.add(day.date);
    days.push({ date: day.date, subject: day.subject });
  }
  if (!days.length) return null;
  days.sort((a, b) => (a.date < b.date ? -1 : 1));

  const cycle = Array.isArray(raw.cycle) ? raw.cycle.filter((id) => SUB_BY_ID[id]) : [];
  return {
    createdAt: isISO(raw.createdAt) ? raw.createdAt : days[0].date,
    startDate: raw.startDate,
    examDate: raw.examDate,
    cycle: cycle.length ? [...new Set(cycle)] : SUBJECTS.map((subject) => subject.id),
    days,
  };
}

export function sanitizeSimulado(raw) {
  if (!raw || typeof raw !== 'object' || !isISO(raw.date)) return null;
  const questions = clamp(Math.floor(Number(raw.questions) || 0), 0, 200);
  if (!questions) return null;
  const correct = clamp(Math.floor(Number(raw.correct) || 0), 0, questions);

  let essay = null;
  if (raw.essay !== null && raw.essay !== undefined && raw.essay !== '') {
    const parsedEssay = Number(raw.essay);
    if (Number.isFinite(parsedEssay)) essay = clamp(Math.round(parsedEssay * 10) / 10, 0, 40);
  }

  let minutes = null;
  if (raw.minutes !== null && raw.minutes !== undefined && raw.minutes !== '') {
    const parsedMinutes = Number(raw.minutes);
    if (Number.isFinite(parsedMinutes)) minutes = clamp(Math.floor(parsedMinutes), 0, 600);
  }

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : uid('sim'),
    date: raw.date,
    title: String(raw.title || 'Simulado PMPE').slice(0, 60),
    questions,
    correct,
    essay,
    minutes,
    notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 1000) : '',
  };
}

export function sanitizeTafSession(raw) {
  if (!raw || typeof raw !== 'object' || !isISO(raw.date)) return null;
  const exercise = TAF_EXERCISES.find((item) => item.id === raw.exerciseId);
  if (!exercise) return null;
  const value = String(raw.value ?? '')
    .trim()
    .slice(0, 20);
  if (!value) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : uid('taf'),
    date: raw.date,
    exerciseId: exercise.id,
    value,
    notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 500) : '',
  };
}

export function sanitizeTaf(raw) {
  const base = defaultTaf();
  if (!raw || typeof raw !== 'object') return base;

  const profile = raw.profile === 'f' ? 'f' : 'm';
  const date = isISO(raw.date) ? raw.date : base.date;
  const targets = {};

  for (const exercise of TAF_EXERCISES) {
    const kind = tafKind(exercise.id, profile);
    const candidate =
      raw.targets && raw.targets[exercise.id] != null ? String(raw.targets[exercise.id]) : '';
    targets[exercise.id] =
      tafParse(candidate, kind) != null ? candidate : TAF_PRESETS[profile][exercise.id];
  }

  const sessions = Array.isArray(raw.sessions)
    ? raw.sessions.map(sanitizeTafSession).filter(Boolean)
    : [];
  return { date, profile, targets, sessions };
}

export function stateFrom(raw) {
  const base = defaultState();
  const state = { ...base, logs: {} };
  if (raw && typeof raw === 'object') {
    if (typeof raw.name === 'string' && raw.name.trim()) state.name = raw.name.trim().slice(0, 30);
    if (isISO(raw.examDate)) state.examDate = raw.examDate;
    if (isISO(raw.startDate)) state.startDate = raw.startDate;
    if (typeof raw.dailyGoal === 'number' && Number.isFinite(raw.dailyGoal)) {
      state.dailyGoal = clamp(raw.dailyGoal, 0.5, 16);
    }
    if (raw.logs && typeof raw.logs === 'object') {
      for (const [date, log] of Object.entries(raw.logs)) {
        if (!isISO(date)) continue;
        const sanitized = sanitizeLog(log);
        if (
          sanitized.subjects.length ||
          sanitized.hours ||
          sanitized.questions ||
          sanitized.notes.trim()
        ) {
          state.logs[date] = sanitized;
        }
      }
    }

    state.goals = { ...DEFAULT_GOALS };
    if (raw.goals && typeof raw.goals === 'object') {
      for (const subject of SUBJECTS) {
        const value = Math.floor(Number(raw.goals[subject.id]));
        if (Number.isFinite(value) && value >= 1) state.goals[subject.id] = clamp(value, 1, 60);
      }
    }

    state.plan = sanitizePlan(raw.plan);
    state.simulados = Array.isArray(raw.simulados)
      ? raw.simulados.map(sanitizeSimulado).filter(Boolean)
      : [];
    state.taf = sanitizeTaf(raw.taf);
  }
  return state;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? stateFrom(JSON.parse(raw)) : stateFrom(null);
  } catch {
    return stateFrom(null);
  }
}

export const state = loadState();
let storageWarned = false;

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    if (!storageWarned) {
      storageWarned = true;
      window.dispatchEvent(new Event('app:storage-error'));
    }
    return false;
  }
}

export function replaceState(raw) {
  const next = stateFrom(raw);
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, next);
}

export function ensureLog(date) {
  if (!state.logs[date]) state.logs[date] = emptyLog();
  return state.logs[date];
}
