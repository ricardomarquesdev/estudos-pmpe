import { $ } from '../core/dom.js';
import { SUB_BY_ID, SUBJECTS } from '../core/constants.js';
import { state } from '../core/state.js';
import {
  addDays,
  fmtNum,
  fmtShortDate,
  fmtShortDateYear,
  fmtWeekdayShort,
  todayISO,
} from '../core/dates.js';
import { clamp, tint } from '../core/utils.js';
import { planMeta, planStatusFor } from '../services/plan.js';
import { logHasSubject, subjectDays } from '../services/stats.js';

export function renderSchedule() {
  const today = todayISO();
  const meta = planMeta(state.plan);
  const todayLog = state.logs[today];
  const doneToday = new Set(todayLog?.subjects || []);
  const todayItem = meta.byDate.get(today) || null;
  const focus = todayItem ? { ...todayItem, done: doneToday.has(todayItem.subject) } : null;

  const focusCard = $('#focusCard');
  const focusStatus = $('#focusStatus');
  const focusBtn = $('#focusBtn');
  const focusGoalLabel = $('#focusGoalLabel');

  if (focus) {
    const sub = SUB_BY_ID[focus.subject];
    focusCard.classList.toggle('done', focus.done);
    focusStatus.textContent = focus.done ? 'Feito hoje ✓' : 'Foco do plano';
    focusStatus.classList.toggle('done', focus.done);
    $('#focusIcon').textContent = sub.icon;
    $('#focusIcon').style.background = tint(sub.color, 0.14);
    $('#focusIcon').style.borderColor = tint(sub.color, 0.28);
    $('#focusSubject').textContent = sub.short;
    $('#focusSubject').title = sub.name;
    $('#focusTask').textContent = focus.task;
    $('#focusBlock').textContent = sub.block;
    $('#focusPoints').textContent = sub.id === 'redacao' ? '40 pontos' : '10 questões';
    $('#focusReasonLabel').textContent = 'Plano';
    $('#focusReason').textContent = `Semana ${focus.week} de ${meta.weeks}`;
    focusBtn.style.display = '';
    focusBtn.dataset.id = sub.id;
    focusBtn.dataset.done = focus.done ? '1' : '0';
    focusBtn.textContent = focus.done ? 'Registrar mais' : 'Marcar como estudado';
    focusGoalLabel.textContent = 'Meta de hoje';
    const h = Number(todayLog?.hours) || 0;
    const goal = Number(state.dailyGoal) || 3;
    const pct = clamp((h / goal) * 100, 0, 100);
    $('#focusGoalFill').style.width = pct + '%';
    $('#focusGoalFill').classList.toggle('done', h >= goal && h > 0);
    $('#focusGoalText').textContent = `${fmtNum(h)}h de ${fmtNum(goal)}h`;
  } else if (today === state.examDate) {
    focusCard.classList.remove('done');
    focusStatus.textContent = 'É hoje';
    focusStatus.classList.remove('done');
    $('#focusIcon').textContent = '🎯';
    $('#focusIcon').style.background = 'rgba(244,201,93,.14)';
    $('#focusIcon').style.borderColor = 'rgba(244,201,93,.3)';
    $('#focusSubject').textContent = 'Dia da prova';
    $('#focusSubject').title = '';
    $('#focusTask').textContent = 'Confie no seu treino. Boa prova!';
    $('#focusBlock').textContent = 'PMPE';
    $('#focusPoints').textContent = '21/02/2027';
    $('#focusReasonLabel').textContent = 'Prova';
    $('#focusReason').textContent = 'É hoje';
    focusBtn.style.display = 'none';
    focusGoalLabel.textContent = 'Prova';
    $('#focusGoalFill').style.width = '100%';
    $('#focusGoalFill').classList.add('done');
    $('#focusGoalText').textContent = 'Boa prova!';
  } else if (today > state.examDate) {
    focusCard.classList.remove('done');
    focusStatus.textContent = 'Encerrado';
    focusStatus.classList.remove('done');
    $('#focusIcon').textContent = '🏁';
    $('#focusIcon').style.background = 'rgba(255,255,255,.04)';
    $('#focusIcon').style.borderColor = 'var(--line)';
    $('#focusSubject').textContent = 'Prova realizada';
    $('#focusSubject').title = '';
    $('#focusTask').textContent = 'Atualize a data em Ajustes para começar um novo ciclo.';
    $('#focusBlock').textContent = 'PMPE';
    $('#focusPoints').textContent = '—';
    $('#focusReasonLabel').textContent = 'Status';
    $('#focusReason').textContent = 'Ciclo encerrado';
    focusBtn.style.display = 'none';
    focusGoalLabel.textContent = 'Meta';
    $('#focusGoalFill').style.width = '0%';
    $('#focusGoalFill').classList.remove('done');
    $('#focusGoalText').textContent = '—';
  } else {
    focusCard.classList.remove('done');
    focusStatus.textContent = 'Sem plano';
    focusStatus.classList.remove('done');
    $('#focusIcon').textContent = '📅';
    $('#focusIcon').style.background = 'rgba(255,255,255,.04)';
    $('#focusIcon').style.borderColor = 'var(--line)';
    $('#focusSubject').textContent = 'Gere seu plano';
    $('#focusSubject').title = '';
    $('#focusTask').textContent = 'Abra a aba Até a prova e gere o cronograma.';
    $('#focusBlock').textContent = '—';
    $('#focusPoints').textContent = '—';
    $('#focusReasonLabel').textContent = 'Plano';
    $('#focusReason').textContent = 'Não gerado';
    focusBtn.style.display = 'none';
    focusGoalLabel.textContent = 'Meta de hoje';
    $('#focusGoalFill').style.width = '0%';
    $('#focusGoalFill').classList.remove('done');
    $('#focusGoalText').textContent = '—';
  }

  $('#scheduleChip').textContent = focus
    ? `Hoje · ${SUB_BY_ID[focus.subject].short}`
    : today === state.examDate
      ? 'Prova hoje'
      : today > state.examDate
        ? 'Ciclo encerrado'
        : 'Sem plano';

  const windowItems = [];
  if (meta.days.length) {
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      if (date > state.examDate) break;
      if (date === state.examDate) {
        windowItems.push({ exam: true, date, isToday: date === today });
        break;
      }
      const item = meta.byDate.get(date);
      if (item) {
        windowItems.push({
          ...item,
          isToday: date === today,
          done: date === today && doneToday.has(item.subject),
        });
      }
    }
  } else if (today === state.examDate) {
    windowItems.push({ exam: true, date: today, isToday: true });
  }

  const planStrip = $('#planStrip');
  if (!windowItems.length) {
    planStrip.innerHTML =
      '<div class="empty" style="grid-column:1/-1">Nenhum plano ativo. Abra a aba <strong>Até a prova</strong> e gere o cronograma.</div>';
  } else {
    planStrip.innerHTML = windowItems
      .map((item) => {
        if (item.exam) {
          return `
          <article class="plan-day exam ${item.isToday ? 'today' : ''}" title="Dia da prova">
            <div class="plan-top"><span class="plan-wd">${item.isToday ? 'Hoje' : 'Prova'}</span><span class="plan-date">${fmtShortDate(item.date)}</span></div>
            <div class="plan-icon" style="background:rgba(244,201,93,.14);border-color:rgba(244,201,93,.3)">🎯</div>
            <div class="plan-subject">Dia da prova</div>
            <div class="plan-task">${item.isToday ? 'Confie no seu treino' : 'Boa prova!'}</div>
            <div class="plan-foot"><span class="plan-done">${item.isToday ? 'É hoje' : 'Prova'}</span></div>
          </article>`;
        }
        const sub = SUB_BY_ID[item.subject];
        const wd = item.isToday ? 'Hoje' : fmtWeekdayShort(item.date).replace('.', '');
        let foot;
        if (item.isToday && item.done) {
          foot = '<span class="plan-done">✓ Feito hoje</span>';
        } else if (item.isToday) {
          foot = `<button type="button" class="plan-btn" data-plan-add="${sub.id}" aria-label="Marcar ${sub.name} hoje">Marcar hoje</button>`;
        } else {
          foot = '<span class="plan-future">Planejado</span>';
        }
        return `
        <article class="plan-day ${item.isToday ? 'today' : ''} ${item.done ? 'done' : ''}" title="${sub.name} · ${sub.block}">
          <div class="plan-top"><span class="plan-wd">${wd}</span><span class="plan-date">${fmtShortDate(item.date)}</span></div>
          <div class="plan-icon" style="background:${tint(sub.color, 0.13)};border-color:${tint(sub.color, 0.26)}">${sub.icon}</div>
          <div class="plan-subject">${sub.short}</div>
          <div class="plan-task">${item.task}</div>
          <div class="plan-foot">${foot}</div>
        </article>`;
      })
      .join('');
  }

  const next = windowItems.filter((item) => !item.isToday).slice(0, 3);
  $('#nextDays').innerHTML = next.length
    ? next
        .map((item) => {
          if (item.exam) {
            return `
            <div class="next-row">
              <span class="next-day"><b>${fmtWeekdayShort(item.date).replace('.', '')}</b><span>${fmtShortDate(item.date)}</span></span>
              <span class="next-icon" style="background:rgba(244,201,93,.12);border-color:rgba(244,201,93,.24)">🎯</span>
              <span class="next-info"><b>Dia da prova</b><span>Boa prova!</span></span>
            </div>`;
          }
          const sub = SUB_BY_ID[item.subject];
          return `
          <div class="next-row">
            <span class="next-day"><b>${fmtWeekdayShort(item.date).replace('.', '')}</b><span>${fmtShortDate(item.date)}</span></span>
            <span class="next-icon" style="background:${tint(sub.color, 0.12)};border-color:${tint(sub.color, 0.24)}">${sub.icon}</span>
            <span class="next-info"><b>${sub.short}</b><span>${item.task}</span></span>
          </div>`;
        })
        .join('')
    : '<p class="next-empty">Sem próximos dias — confira o plano até a prova.</p>';
}

export function renderFullPlan() {
  const meta = planMeta(state.plan);
  const today = todayISO();
  const summary = $('#planSummaryCard');
  const weeksRoot = $('#fullPlanWeeks');
  const chip = $('#fullPlanChip');
  const exam = state.examDate;

  if (!meta.plan || !meta.days.length) {
    chip.textContent = 'Sem plano';
    const msg =
      today >= exam
        ? 'O período de estudos terminou. Atualize a data da prova em Ajustes para gerar um novo plano.'
        : 'Gere o cronograma fechado de hoje até a véspera da prova.';
    summary.innerHTML = `
      <div class="empty" style="border:none;background:transparent;padding:10px 0 4px">
        <strong>Plano até a prova</strong>
        <p>${msg}</p>
        ${today < exam ? '<button type="button" class="btn btn-gold" data-generate-plan>Gerar plano até a prova</button>' : ''}
      </div>`;
    weeksRoot.innerHTML = '';
    return;
  }

  const p = meta.plan;
  const elapsed = meta.days.filter((d) => d.date <= today);
  const doneElapsed = elapsed.filter((d) => logHasSubject(state, d.date, d.subject)).length;
  const first = meta.days[0].date;
  const last = meta.days[meta.days.length - 1].date;
  chip.textContent = `${meta.days.length} dias`;
  const cycle = (p.cycle || SUBJECTS.map((s) => s.id)).map((id) => SUB_BY_ID[id]).filter(Boolean);

  summary.innerHTML = `
    <div class="plan-summary-head">
      <div>
        <span class="eyebrow">Plano fechado</span>
        <h2>${meta.days.length} dias até a prova</h2>
        <p>De ${fmtShortDateYear(first)} a ${fmtShortDateYear(last)} · ${meta.weeks} semanas · prova em ${fmtShortDateYear(exam)}.</p>
      </div>
      <button type="button" class="btn" data-generate-plan>Regerar plano</button>
    </div>
    <div class="plan-summary-stats">
      <div class="summary-stat"><span>Dias planejados</span><strong>${meta.days.length}</strong></div>
      <div class="summary-stat"><span>Semanas</span><strong>${meta.weeks}</strong></div>
      <div class="summary-stat"><span>Foco cumprido</span><strong>${doneElapsed}/${elapsed.length}</strong></div>
      <div class="summary-stat"><span>Matérias</span><strong>${cycle.length}</strong></div>
    </div>
    <div class="plan-cycle">
      ${cycle.map((sub) => `<span style="border-color:${tint(sub.color, 0.24)};background:${tint(sub.color, 0.08)}">${sub.icon} ${sub.short}</span>`).join('')}
    </div>
    <p class="plan-summary-note">Plano gerado em ${fmtShortDateYear(p.createdAt || p.startDate)}. O plano é fixo: se um dia passar em branco, a matéria aparece na revisão sugerida. Regenere quando sua rotina mudar.</p>
  `;

  const groups = [];
  for (let w = 0; w < meta.weeks; w++) {
    const days = meta.days.slice(w * 7, w * 7 + 7);
    if (!days.length) continue;
    const start = days[0].date;
    const end = days[days.length - 1].date;
    const isCurrent = start <= today && today <= end;
    const past = end < today;
    const countDone = days.filter(
      (d) => d.date <= today && logHasSubject(state, d.date, d.subject),
    ).length;
    groups.push({ w, days, start, end, isCurrent, past, countDone });
  }

  weeksRoot.innerHTML =
    groups
      .map(
        (g) => `
    <details class="plan-week" ${g.isCurrent ? 'open' : ''}>
      <summary>
        <span class="week-title">Semana ${g.w + 1}</span>
        <span class="week-range">${fmtShortDate(g.start)} – ${fmtShortDate(g.end)}</span>
        <span class="week-count ${g.past ? 'past' : g.isCurrent ? 'current' : ''}">${g.countDone}/${g.days.length} focos</span>
        <span class="week-chevron">›</span>
      </summary>
      <div class="plan-week-body">
        ${g.days
          .map((d) => {
            const sub = SUB_BY_ID[d.subject];
            const status = planStatusFor(state, d, today);
            const labels = {
              done: 'Feito ✓',
              today: 'Hoje',
              other: 'Outro foco',
              missed: 'Sem registro',
              future: 'Previsto',
            };
            const canOpen = d.date <= today;
            return `
            <button type="button" class="plan-row ${status}" ${canOpen ? `data-plan-date="${d.date}"` : 'disabled'}>
              <span class="plan-row-date"><b>${fmtWeekdayShort(d.date).replace('.', '')}</b><span>${fmtShortDate(d.date)}</span></span>
              <span class="plan-row-icon" style="background:${tint(sub.color, 0.11)};border-color:${tint(sub.color, 0.22)}">${sub.icon}</span>
              <span class="plan-row-main"><b>${sub.short}</b><span>${d.task}</span></span>
              <span class="plan-row-status">${labels[status]}</span>
            </button>`;
          })
          .join('')}
      </div>
    </details>`,
      )
      .join('') +
    `
    <div class="exam-marker">
      <span>${fmtShortDateYear(exam)}</span>
      <strong>Dia da prova</strong>
      <p>Sem novo conteúdo. Revise o essencial e confie no seu treino.</p>
    </div>`;
}

export function renderGoals() {
  const meta = planMeta(state.plan);
  const stats = subjectDays(state);
  let met = 0;
  $('#goalsList').innerHTML = SUBJECTS.map((s) => {
    const goal = state.goals[s.id] || 12;
    const days = stats.find((x) => x.id === s.id)?.days || 0;
    const planCount = meta.counts[s.id] || 0;
    const pct = clamp((days / goal) * 100, 0, 100);
    if (days >= goal) met++;
    return `
      <div class="goal-item">
        <span class="goal-item-icon" style="background:${tint(s.color, 0.12)};border-color:${tint(s.color, 0.24)}">${s.icon}</span>
        <div class="goal-item-info">
          <div class="goal-item-line"><b>${s.name}</b><span>${days}/${goal} dias${days >= goal ? ' ✓' : ''}</span></div>
          <div class="goal-item-bar"><span style="width:${pct}%;background:${days >= goal ? 'var(--green)' : s.color}"></span></div>
          <small>Plano reserva ${planCount} ${planCount === 1 ? 'dia' : 'dias'} · ${s.block}</small>
        </div>
        <label class="goal-item-input">
          <input type="number" id="goal-${s.id}" min="1" max="60" value="${goal}" aria-label="Meta de dias de ${s.name}">
          <span>dias</span>
        </label>
      </div>`;
  }).join('');
  $('#goalsMet').textContent = `${met} de ${SUBJECTS.length} metas batidas`;
}
