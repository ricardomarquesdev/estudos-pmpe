import { $, $$ } from '../core/dom.js';
import { SUBJECTS } from '../core/constants.js';
import { state, emptyLog } from '../core/state.js';
import { uiState } from '../core/ui-state.js';
import { cap, fmtHumanDate, fmtNum, todayISO } from '../core/dates.js';
import { clamp } from '../core/utils.js';

export function buildChips() {
  $('#subjectGrid').innerHTML = SUBJECTS.map(
    (s) => `
    <button type="button" class="subject" data-id="${s.id}" aria-pressed="false">
      <span class="s-icon" aria-hidden="true">${s.icon}</span>
      <span class="s-name">${s.name}</span>
      <span class="s-check" aria-hidden="true">✓</span>
    </button>`,
  ).join('');
}

export function syncChips() {
  const active = new Set(state.logs[uiState.selectedDate]?.subjects || []);
  $$('.subject').forEach((chip) => {
    const on = active.has(chip.dataset.id);
    chip.classList.toggle('active', on);
    chip.setAttribute('aria-pressed', String(on));
  });
}

export function renderLog() {
  const log = state.logs[uiState.selectedDate] || emptyLog();
  const today = todayISO();
  const dateInput = $('#logDate');
  dateInput.value = uiState.selectedDate;
  dateInput.max = today;
  $('#prevDay').disabled = false;
  $('#nextDay').disabled = uiState.selectedDate >= today;

  const human = fmtHumanDate(uiState.selectedDate);
  $('#logHint').textContent = uiState.selectedDate === today ? `Hoje · ${human}` : cap(human);

  $('#hours').value = log.hours ? String(log.hours) : '';
  $('#questions').value = log.questions ? String(log.questions) : '';
  $('#correct').value = log.correct ? String(log.correct) : '';
  $('#notes').value = log.notes || '';
  syncChips();
  updateLogSummary();
}

export function updateLogSummary() {
  const log = state.logs[uiState.selectedDate] || emptyLog();
  const count = log.subjects.length;
  $('#subjectCount').textContent = count
    ? `${count} ${count === 1 ? 'matéria marcada' : 'matérias marcadas'}`
    : 'Nenhuma matéria marcada';

  const q = Number(log.questions) || 0;
  const c = Number(log.correct) || 0;
  const acc = q ? Math.round((Math.min(c, q) / q) * 100) : null;
  const perf = $('#dayPerf');
  if (acc === null) {
    perf.textContent = '—';
    perf.style.color = 'var(--dim)';
  } else {
    perf.textContent = acc + '%';
    perf.style.color = acc >= 70 ? 'var(--green)' : acc >= 40 ? 'var(--gold)' : 'var(--red)';
  }

  const h = Number(log.hours) || 0;
  const goal = Number(state.dailyGoal) || 3;
  const pct = clamp((h / goal) * 100, 0, 100);
  const fill = $('#goalFill');
  fill.style.width = pct + '%';
  fill.classList.toggle('done', h >= goal && h > 0);
  $('#goalText').textContent = `${fmtNum(h)}h de ${fmtNum(goal)}h`;

  const badge = $('#goalBadge');
  if (h >= goal && h > 0) {
    badge.textContent = 'Meta batida ✓';
    badge.classList.add('hit');
  } else {
    badge.textContent = `Meta diária: ${fmtNum(goal)}h`;
    badge.classList.remove('hit');
  }
}
