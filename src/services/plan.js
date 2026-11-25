import { SUBJECTS } from '../core/constants.js';
import { addDays, diffDays, todayISO } from '../core/dates.js';
import { hasAnyLog, logHasSubject, subjectDays } from './stats.js';

export function fixedTask(subjectId, occurrence) {
  if (subjectId === 'redacao') {
    return occurrence < 3 ? '1 redação completa' : 'Redação + correção';
  }
  if (occurrence < 3) return 'Teoria + 10 questões';
  if (occurrence < 7) return 'Revisão + 15 questões';
  return 'Simulado + revisão';
}

export function subjectPriorityOrder(state, today = todayISO()) {
  const stats = subjectDays(state);
  return stats
    .map((subject, index) => {
      const gap = subject.last ? Math.min(diffDays(subject.last, today), 45) : 45;
      const load = Math.max(0, 12 - subject.days) * 2.2;
      return { id: subject.id, index, score: gap + load };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((subject) => subject.id);
}

export function createPlan(state, today = todayISO()) {
  if (today >= state.examDate) return null;

  const cycle = subjectPriorityOrder(state, today);
  const end = addDays(state.examDate, -1);
  const days = [];
  let index = 0;

  for (let date = today; date <= end; date = addDays(date, 1), index += 1) {
    const week = Math.floor(index / 7);
    const subject = cycle[(index + week) % cycle.length];
    days.push({ date, subject });
  }

  return {
    createdAt: today,
    startDate: today,
    examDate: state.examDate,
    cycle,
    days,
  };
}

export function isPlanValid(plan, state, today = todayISO()) {
  const expectedLast = today < state.examDate ? addDays(state.examDate, -1) : null;
  return (
    !!plan &&
    Array.isArray(plan.days) &&
    plan.days.length > 0 &&
    plan.examDate === state.examDate &&
    plan.days[0].date <= today &&
    (!expectedLast || plan.days[plan.days.length - 1].date === expectedLast) &&
    (today >= state.examDate || plan.days.some((day) => day.date === today))
  );
}

export function planMeta(plan) {
  if (!plan || !Array.isArray(plan.days)) {
    return { plan: null, days: [], byDate: new Map(), counts: {}, weeks: 0 };
  }

  const counts = {};
  const byDate = new Map();
  const days = [];

  plan.days.forEach((day, index) => {
    const occurrence = counts[day.subject] || 0;
    counts[day.subject] = occurrence + 1;
    const item = {
      ...day,
      index,
      week: Math.floor(index / 7) + 1,
      occurrence,
      task: fixedTask(day.subject, occurrence),
    };
    days.push(item);
    byDate.set(day.date, item);
  });

  return { plan, days, byDate, counts, weeks: Math.ceil(days.length / 7) };
}

export function planStatusFor(state, day, today = todayISO()) {
  if (day.date === today) return logHasSubject(state, today, day.subject) ? 'done' : 'today';
  if (day.date < today) {
    if (logHasSubject(state, day.date, day.subject)) return 'done';
    return hasAnyLog(state, day.date) ? 'other' : 'missed';
  }
  return 'future';
}

export const PLAN_SUBJECT_COUNT = SUBJECTS.length;
