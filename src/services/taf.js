import { tafKind, tafParse } from '../core/taf.js';
import { fmtNum } from '../core/dates.js';
import { clamp } from '../core/utils.js';

export function tafStats(taf, exerciseId) {
  const kind = tafKind(exerciseId, taf.profile);
  const targetRaw = taf.targets[exerciseId];
  const target = targetRaw == null ? null : tafParse(targetRaw, kind);

  const list = taf.sessions
    .filter((session) => session.exerciseId === exerciseId)
    .map((session) => ({ ...session, num: tafParse(session.value, kind) }))
    .filter((session) => session.num != null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const valid = list.map((session) => session.num);
  const best = valid.length ? (kind === 'time' ? Math.min(...valid) : Math.max(...valid)) : null;
  const last = list[0] || null;

  let met = false;
  if (best != null && target != null) {
    met = kind === 'time' ? best <= target : best >= target;
  }

  let progress = 0;
  if (best != null && target != null && target > 0) {
    progress =
      kind === 'time' ? clamp((target / best) * 100, 0, 100) : clamp((best / target) * 100, 0, 100);
  }

  let status;
  let statusClass = '';
  if (target == null) {
    status = 'Defina a meta';
  } else if (best == null) {
    status = 'Sem treino';
  } else if (met) {
    status = 'Meta batida ✓';
    statusClass = 'done';
  } else {
    const difference = kind === 'time' ? best - target : target - best;
    if (kind === 'time') {
      const seconds = Math.round(difference);
      status = `Faltam ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    } else if (kind === 'meters') {
      status = difference === 1 ? 'Falta 1 m' : `Faltam ${fmtNum(difference)} m`;
    } else {
      const repetitions = Math.ceil(difference);
      status = repetitions === 1 ? 'Falta 1 rep' : `Faltam ${repetitions} reps`;
    }
  }

  return { kind, target, targetRaw, best, last, met, progress, status, statusClass };
}
