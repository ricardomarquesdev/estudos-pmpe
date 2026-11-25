import { $ } from '../core/dom.js';
import { LOCALE, MONTHS, SUBJECTS } from '../core/constants.js';
import { state } from '../core/state.js';
import {
  fmtFullDate,
  fmtHours,
  fmtInt,
  fmtNum,
  fmtShortDate,
  addDays,
  parseISO,
  mondayOf,
  relDay,
  todayISO,
} from '../core/dates.js';
import { getStats, hasStudy, subjectDays } from '../services/stats.js';
import { clamp } from '../core/utils.js';

export function levelOf(log) {
  if (!log) return 0;
  const h = Number(log.hours) || 0;
  const n = (log.subjects || []).length;
  const q = Number(log.questions) || 0;
  if (!h && !n && !q) return 0;
  const score = h + n * 0.35 + (q ? 0.45 : 0);
  if (score >= 6) return 4;
  if (score >= 4) return 3;
  if (score >= 2) return 2;
  return 1;
}

export function renderHeatmap() {
  const weeks = 18;
  const today = todayISO();
  const first = addDays(mondayOf(today), -(weeks - 1) * 7);
  const grid = $('#heatGrid');
  const months = $('#heatMonths');
  grid.innerHTML = '';
  months.innerHTML = '';

  let prevMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const monday = addDays(first, w * 7);
    const m = parseISO(monday).getMonth();
    if (m !== prevMonth) {
      const label = document.createElement('span');
      label.className = 'heat-month';
      label.textContent = MONTHS[m];
      label.style.gridColumn = `${w + 1} / span ${Math.min(4, weeks - w)}`;
      months.appendChild(label);
      prevMonth = m;
    }
    for (let d = 0; d < 7; d++) {
      const date = addDays(monday, d);
      const log = state.logs[date];
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'heat-cell';
      cell.dataset.date = date;
      const lvl = levelOf(log);
      if (lvl) cell.classList.add('l' + lvl);
      if (date === today) cell.classList.add('today');

      let tip = fmtFullDate(date);
      if (log) {
        const bits = [];
        if (log.subjects.length) {
          bits.push(`${log.subjects.length} matéria${log.subjects.length > 1 ? 's' : ''}`);
        }
        if (Number(log.hours)) bits.push(fmtHours(log.hours));
        tip += ' · ' + (bits.join(' · ') || 'registro');
      } else {
        tip += ' · sem registro';
      }
      cell.title = tip;
      cell.setAttribute('aria-label', tip);

      if (date > today) {
        cell.classList.add('future');
        cell.disabled = true;
      }
      grid.appendChild(cell);
    }
  }

  const s = getStats(state);
  $('#heatTotal').textContent = `${fmtInt(s.studiedDays)} ${s.studiedDays === 1 ? 'dia' : 'dias'}`;

  let bestDay = null;
  for (const [date, log] of Object.entries(state.logs)) {
    const h = Number(log.hours) || 0;
    if (h > 0 && (!bestDay || h > bestDay.hours || (h === bestDay.hours && date > bestDay.date))) {
      bestDay = { date, hours: h };
    }
  }
  $('#heatBestDay').textContent = bestDay
    ? `${fmtShortDate(bestDay.date)} · ${fmtHours(bestDay.hours)}`
    : '—';
  const topSubject = subjectDays(state).sort((a, b) => b.days - a.days)[0];
  $('#heatTopSubject').textContent =
    topSubject && topSubject.days ? `${topSubject.short} · ${topSubject.days} dias` : '—';
}

export function renderReview() {
  const last = {};
  for (const [date, log] of Object.entries(state.logs)) {
    if (!hasStudy(log)) continue;
    for (const id of log.subjects || []) {
      if (!last[id] || date > last[id]) last[id] = date;
    }
  }
  const list = SUBJECTS.slice()
    .sort((a, b) => {
      const la = last[a.id] || '';
      const lb = last[b.id] || '';
      if (!la && !lb) return 0;
      if (!la) return -1;
      if (!lb) return 1;
      return la < lb ? -1 : 1;
    })
    .slice(0, 3);

  $('#reviewList').innerHTML =
    list
      .map((s) => {
        const when = last[s.id] ? `Última vez ${relDay(last[s.id])}` : 'Ainda não estudada';
        return `
      <div class="review-item">
        <span class="review-icon" style="color:${s.color}">${s.icon}</span>
        <span class="review-info">
          <span class="review-name">${s.short}</span>
          <span class="review-meta">${when}</span>
        </span>
        <button type="button" class="review-add" data-add="${s.id}" title="Marcar ${s.name} hoje">+ hoje</button>
      </div>`;
      })
      .join('') || '<p class="review-empty">Tudo em dia por aqui.</p>';
}

export function renderSubjects() {
  const stats = subjectDays(state).sort(
    (a, b) => b.days - a.days || a.name.localeCompare(b.name, LOCALE),
  );
  $('#subjectStats').innerHTML = stats
    .map((s) => {
      const goal = state.goals[s.id] || 12;
      const points = s.id === 'redacao' ? '40 pontos' : '10 questões';
      const rel = s.last ? `última vez ${relDay(s.last)}` : 'ainda não estudada';
      const width = s.days ? clamp((s.days / goal) * 100, 0, 100) : 0;
      const met = s.days >= goal;
      return `
      <button type="button" class="subject-row" data-subject="${s.id}" title="Marcar ${s.name} no dia de hoje">
        <span class="dot" style="background:${s.color};color:${s.color}"></span>
        <span class="s-info">
          <span class="s-line">
            <span class="s-name">${s.name}</span>
            <span class="s-days ${met ? 'met' : ''}">${s.days}/${goal} dias${met ? ' ✓' : ''}</span>
          </span>
          <span class="s-bar"><span style="width:${width}%;background:${met ? 'var(--green)' : s.color}"></span></span>
          <span class="s-meta">${s.block} · ${points} · ${rel}</span>
        </span>
      </button>`;
    })
    .join('');
}

export function renderChart() {
  const cur = mondayOf(todayISO());
  const data = [];
  for (let i = 7; i >= 0; i--) {
    const monday = addDays(cur, -i * 7);
    const end = addDays(monday, 6);
    let hours = 0;
    for (const [d, l] of Object.entries(state.logs)) {
      if (d >= monday && d <= end) hours += Number(l.hours) || 0;
    }
    data.push({ monday, end, hours, current: i === 0 });
  }
  const max = Math.max(1, ...data.map((d) => d.hours));
  const total = data.reduce((a, d) => a + d.hours, 0);

  $('#weekChart').innerHTML = data
    .map((d) => {
      const h = d.hours > 0 ? Math.max(4, (d.hours / max) * 100) : 0;
      const height = d.hours > 0 ? h + '%' : '3px';
      const label = fmtShortDate(d.monday);
      return `
      <div class="chart-col" title="Semana de ${label} · ${fmtHours(d.hours)}">
        <span class="chart-val">${d.hours ? fmtNum(d.hours) : ''}</span>
        <div class="chart-plot">
          <div class="chart-bar ${d.hours ? '' : 'zero'} ${d.current ? 'current' : ''}" style="height:${height}"></div>
        </div>
        <span class="chart-label">${label}</span>
      </div>`;
    })
    .join('');

  $('#chartTotal').textContent = fmtHours(total);
  $('#chartNote').textContent = total
    ? `Total de ${fmtHours(total)} nas últimas 8 semanas.`
    : 'As horas do registro do dia alimentam este gráfico.';

  if (!total) {
    $('#weekChart').innerHTML =
      '<div class="chart-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" style="width:32px;height:32px;opacity:.45"><path d="M3 20h18"/><rect x="5" y="12" width="3" height="6" rx="1"/><rect x="11" y="7" width="3" height="11" rx="1"/><rect x="17" y="10" width="3" height="8" rx="1"/></svg>Seu gráfico aparece aqui<br>Registre horas de estudo para começar.</div>';
  }
}
