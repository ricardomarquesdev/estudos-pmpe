import { $ } from '../core/dom.js';
import { state, persist } from '../core/state.js';
import { fmtInt, fmtNum, fmtShortDateYear, isISO, todayISO } from '../core/dates.js';
import { esc, uid } from '../core/utils.js';
import { simMaxPoints, simPercent, simTotalPoints } from '../services/simulados.js';
import { flashSaved, toast } from './feedback.js';

export function renderSimulados() {
  const list = [...state.simulados].sort((a, b) => (a.date < b.date ? 1 : -1));
  const percents = list.map(simPercent);
  const total = list.length;
  const avg = total ? Math.round(percents.reduce((a, b) => a + b, 0) / total) : null;
  const best = total ? Math.max(...percents) : null;
  const last = total ? percents[0] : null;

  $('#simTotal').textContent = fmtInt(total);
  $('#simAvg').textContent = avg === null ? '—' : `${avg}%`;
  $('#simBest').textContent = best === null ? '—' : `${best}%`;
  $('#simLast').textContent = last === null ? '—' : `${last}%`;
  $('#simHistoryCount').textContent = `${total} ${total === 1 ? 'simulado' : 'simulados'}`;

  if (!list.length) {
    $('#simList').innerHTML =
      '<div class="empty"><strong>Nenhum simulado registrado</strong><p>Use o formulário ao lado para guardar seu primeiro resultado.</p></div>';
    return;
  }

  $('#simList').innerHTML = list
    .map((s) => {
      const pct = simPercent(s);
      const cls = pct >= 70 ? 'good' : pct >= 50 ? 'mid' : 'bad';
      const essay = s.essay != null ? ` · redação ${fmtNum(s.essay)}/40` : '';
      const minutes = s.minutes != null ? ` · ${s.minutes} min` : '';
      return `
      <div class="sim-row">
        <div class="sim-row-top">
          <b>${esc(s.title)}</b>
          <span class="sim-score ${cls}">${pct}%</span>
        </div>
        <div class="sim-row-meta">${fmtShortDateYear(s.date)} · ${s.correct}/${s.questions} questões${essay}${minutes}</div>
        <div class="sim-row-total">Nota ${fmtNum(simTotalPoints(s))}/${simMaxPoints(s)}</div>
        ${s.notes.trim() ? `<p>${esc(s.notes)}</p>` : ''}
        <button type="button" class="sim-del" data-del-sim="${s.id}" aria-label="Apagar simulado" title="Apagar simulado">×</button>
      </div>`;
    })
    .join('');
}

export function resetSimForm() {
  $('#simDate').value = todayISO();
  $('#simTitle').value = 'Simulado PMPE';
  $('#simQuestions').value = '60';
  $('#simCorrect').value = '';
  $('#simEssay').value = '';
  $('#simMinutes').value = '';
  $('#simNotes').value = '';
}

export function addSimulado() {
  const date = $('#simDate').value;
  if (!isISO(date) || date > todayISO()) {
    toast('Escolha uma data válida, até hoje.');
    return;
  }
  const questions = Math.floor(Number($('#simQuestions').value) || 0);
  if (questions < 1 || questions > 200) {
    toast('Informe entre 1 e 200 questões.');
    return;
  }
  const correct = Math.floor(Number($('#simCorrect').value) || 0);
  if (correct < 0 || correct > questions) {
    toast('Os acertos precisam estar entre 0 e o total de questões.');
    return;
  }
  const essayRaw = $('#simEssay').value.trim();
  let essay = null;
  if (essayRaw !== '') {
    const e = Number(essayRaw);
    if (!Number.isFinite(e) || e < 0 || e > 40) {
      toast('A nota da redação deve ficar entre 0 e 40.');
      return;
    }
    essay = Math.round(e * 10) / 10;
  }
  const minutesRaw = $('#simMinutes').value.trim();
  let minutes = null;
  if (minutesRaw !== '') {
    const m = Number(minutesRaw);
    if (!Number.isFinite(m) || m < 0 || m > 600) {
      toast('O tempo deve ficar entre 0 e 600 minutos.');
      return;
    }
    minutes = Math.floor(m);
  }
  const title = $('#simTitle').value.trim().slice(0, 60) || 'Simulado PMPE';
  const notes = $('#simNotes').value.trim().slice(0, 1000);
  state.simulados.push({ id: uid('sim'), date, title, questions, correct, essay, minutes, notes });
  persist();
  renderSimulados();
  resetSimForm();
  flashSaved();
  toast('Simulado registrado ✓');
}

export function deleteSimulado(id) {
  const item = state.simulados.find((s) => s.id === id);
  if (!item) return;
  if (!confirm(`Apagar o simulado "${item.title}"?`)) return;
  state.simulados = state.simulados.filter((s) => s.id !== id);
  persist();
  renderSimulados();
  flashSaved();
  toast('Simulado removido.');
}
