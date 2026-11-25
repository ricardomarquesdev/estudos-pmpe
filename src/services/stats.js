import { SUBJECTS } from '../core/constants.js';
import { addDays, diffDays, todayISO } from '../core/dates.js';
import { clamp } from '../core/utils.js';

export function hasStudy(log) {
  return !!(
    log &&
    ((log.subjects && log.subjects.length) || Number(log.hours) > 0 || Number(log.questions) > 0)
  );
}

export function getStats(state, today = todayISO()) {
  const entries = Object.entries(state.logs);
  const studied = entries
    .filter(([, log]) => hasStudy(log))
    .map(([date]) => date)
    .sort();
  const studiedSet = new Set(studied);

  const totalHours = entries.reduce((total, [, log]) => total + (Number(log.hours) || 0), 0);
  const totalQuestions = entries.reduce(
    (total, [, log]) => total + (Number(log.questions) || 0),
    0,
  );
  const totalCorrect = entries.reduce((total, [, log]) => total + (Number(log.correct) || 0), 0);

  let cursor = studiedSet.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (studiedSet.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  let best = 0;
  let run = 0;
  let previous = null;
  for (const date of studied) {
    run = previous && diffDays(previous, date) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    previous = date;
  }

  const end = today > state.examDate ? state.examDate : today;
  const windowDays = end >= state.startDate ? diffDays(state.startDate, end) + 1 : 0;
  const inWindow =
    windowDays > 0 ? studied.filter((date) => date >= state.startDate && date <= end).length : 0;
  const consistency = windowDays > 0 ? clamp(inWindow / windowDays, 0, 1) : 0;

  return {
    studied,
    studiedDays: studied.length,
    totalHours,
    totalQ: totalQuestions,
    totalC: totalCorrect,
    streak,
    best,
    windowDays,
    inWindow,
    consistency,
    acc: totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
  };
}

export function subjectDays(state) {
  const map = new Map(SUBJECTS.map((subject) => [subject.id, { days: 0, last: '' }]));
  for (const [date, log] of Object.entries(state.logs)) {
    if (!hasStudy(log)) continue;
    for (const id of log.subjects || []) {
      const row = map.get(id);
      if (!row) continue;
      row.days += 1;
      if (date > row.last) row.last = date;
    }
  }
  return SUBJECTS.map((subject) => ({ ...subject, ...map.get(subject.id) }));
}

export function logHasSubject(state, date, subjectId) {
  const log = state.logs[date];
  return !!(log && Array.isArray(log.subjects) && log.subjects.includes(subjectId));
}

export function hasAnyLog(state, date) {
  const log = state.logs[date];
  return !!(log && (log.subjects.length || log.hours || log.questions || log.notes.trim()));
}
