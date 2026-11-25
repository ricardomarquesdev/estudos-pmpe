import { $ } from '../core/dom.js';
import { state } from '../core/state.js';
import {
  cap,
  diffDays,
  fmtDateLong,
  fmtHumanDate,
  fmtInt,
  fmtShortDateYear,
  todayISO,
} from '../core/dates.js';
import { getStats } from '../services/stats.js';
import { clamp, greetingPrefix, initials } from '../core/utils.js';

export function heroMessage(days) {
  if (days < 0) return 'A data da prova já passou. Abra Ajustes e atualize a contagem.';
  if (days === 0) return 'É hoje! Respire, confie no que treinou e vai com tudo. 🍀';
  if (days <= 7) return 'Reta final. Revise o essencial, cuide do sono e mantenha a calma.';
  if (days <= 30) return 'A prova está chegando. Constância vale mais que intensidade agora.';
  if (days <= 60) return 'Bom ritmo. Bata sua meta diária e revise o que já estudou.';
  return 'Cada dia conta. Comece pelo que rende mais e mantenha a sequência.';
}

export function renderProfile() {
  const name = state.name || 'Estudante';
  $('#profileName').textContent = name;
  $('#profileInitial').textContent = initials(name);
  $('#greetPrefix').textContent = greetingPrefix();
  $('#greetName').textContent = name;
  $('#greetNameWrap').style.display = name ? '' : 'none';
}

export function renderHero() {
  const today = todayISO();
  const days = diffDays(today, state.examDate);
  const st = getStats(state);

  $('#daysLeft').textContent = days > 0 ? days : 0;
  $('#examDateLong').textContent = fmtDateLong(state.examDate);
  $('#heroMessage').textContent = heroMessage(days);
  document.title =
    days > 0 ? `${days} dias · PMPE | Central de Estudos` : 'PMPE · Central de Estudos';

  const total = diffDays(state.startDate, state.examDate);
  const done = clamp(diffDays(state.startDate, today), 0, Math.max(total, 0));
  const pct = total > 0 ? clamp((done / total) * 100, 0, 100) : days <= 0 ? 100 : 0;
  $('#timelineFill').style.width = pct + '%';
  $('#timelineDot').style.left = clamp(pct, 1, 99) + '%';
  $('#timePct').textContent = Math.round(pct) + '% do tempo';
  const bar = $('.timeline');
  if (bar) bar.setAttribute('aria-valuenow', String(Math.round(pct)));
  $('#startShort').textContent = fmtShortDateYear(state.startDate);
  $('#examShort').textContent = fmtShortDateYear(state.examDate);

  $('#sideDays').textContent = days > 0 ? days : 0;
  $('#sideExamDate').textContent = fmtShortDateYear(state.examDate);
  $('#sideProgress').style.width = pct + '%';

  const ringPct = Math.round(st.consistency * 100);
  $('#ringPct').textContent = ringPct + '%';
  const C = 2 * Math.PI * 62;
  const fg = $('#ringFg');
  if (fg) {
    fg.style.strokeDasharray = String(C);
    fg.style.strokeDashoffset = String(C * (1 - ringPct / 100));
  }
  $('#ringSub').textContent =
    `${st.inWindow} de ${st.windowDays} ${st.windowDays === 1 ? 'dia' : 'dias'} com estudo`;
  $('#ringRecord').textContent = `${st.best} ${st.best === 1 ? 'dia' : 'dias'}`;
  $('#ringQuestions').textContent = `${fmtInt(st.totalQ)} · ${st.acc}%`;

  $('#todayLabel').textContent = cap(fmtHumanDate(todayISO()));
}
