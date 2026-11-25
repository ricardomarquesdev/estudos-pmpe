import { SUB_BY_ID } from '../core/constants.js';
import { fmtNum, fmtShortDateYear } from '../core/dates.js';

export function buildCsv(state) {
  const dates = Object.keys(state.logs).sort();
  if (!dates.length) return '';

  const rows = [
    ['Data', 'Matérias', 'Horas', 'Questões', 'Acertos', 'Aproveitamento (%)', 'Observações'],
  ];

  for (const date of dates) {
    const log = state.logs[date];
    rows.push([
      fmtShortDateYear(date),
      log.subjects.map((id) => SUB_BY_ID[id].name).join(' | '),
      fmtNum(log.hours),
      log.questions || '',
      log.correct || '',
      log.questions ? Math.round((Math.min(log.correct, log.questions) / log.questions) * 100) : '',
      log.notes.replace(/\s+/g, ' ').trim(),
    ]);
  }

  return `\uFEFF${rows
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n')}`;
}

export function buildBackup(state) {
  return JSON.stringify(state, null, 2);
}

export function parseBackup(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || !data.logs || typeof data.logs !== 'object') {
    throw new Error('Backup inválido');
  }
  return data;
}
