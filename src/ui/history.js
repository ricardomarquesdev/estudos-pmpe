import { $ } from '../core/dom.js';
import { SUB_BY_ID, SUBJECTS } from '../core/constants.js';
import { state } from '../core/state.js';
import { uiState } from '../core/ui-state.js';
import { fmtHours, fmtInt, fmtShortDateYear, fmtWeekdayShort } from '../core/dates.js';
import { esc, truncate } from '../core/utils.js';

export function initHistoryFilter() {
  const sel = $('#historySubject');
  if (!sel) return;
  sel.innerHTML =
    '<option value="all">Todas as matérias</option>' +
    SUBJECTS.map((s) => `<option value="${s.id}">${s.name}</option>`).join('');
}

export function renderHistory() {
  const sel = $('#historySubject');
  if (sel && sel.value !== uiState.historyFilter) sel.value = uiState.historyFilter;

  let rows = Object.entries(state.logs)
    .filter(([, l]) => l.subjects.length || l.hours || l.questions || l.notes.trim())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1));

  const hasAny = rows.length > 0;
  if (uiState.historyFilter !== 'all') {
    rows = rows.filter(([, l]) => (l.subjects || []).includes(uiState.historyFilter));
  }

  $('#historyCount').textContent = `${rows.length} ${rows.length === 1 ? 'registro' : 'registros'}`;

  if (!rows.length) {
    $('#historyBody').innerHTML = `
      <div class="empty history-empty">
        <span class="empty-icon">🗂️</span>
        <strong>${hasAny ? 'Nenhum registro com esse filtro' : 'Seu histórico começa hoje'}</strong>
        <p>${hasAny ? 'Escolha outra matéria ou veja todos os registros.' : 'Marque sua primeira matéria no registro do dia e ele aparece aqui.'}</p>
        ${
          hasAny
            ? '<button type="button" class="btn" data-history-all>Ver todos os registros</button>'
            : '<button type="button" class="btn btn-gold" data-view="hoje" data-goto-log>Registrar meu dia</button>'
        }
      </div>`;
    return;
  }

  const body = rows
    .map(([date, l]) => {
      const names = l.subjects.map((id) => SUB_BY_ID[id]?.short || id);
      const fullNames = l.subjects.map((id) => SUB_BY_ID[id]?.name || id).join(', ');
      const shown = names.slice(0, 2).join(' · ');
      const more = names.length > 2 ? ` +${names.length - 2}` : '';
      const acc = l.questions
        ? Math.round((Math.min(l.correct, l.questions) / l.questions) * 100)
        : null;
      const accClass = acc === null ? '' : acc >= 70 ? 'good' : acc >= 40 ? 'mid' : 'bad';
      return `
      <tr class="row-click" data-date="${date}" title="Abrir registro de ${fmtShortDateYear(date)}">
        <td><strong>${fmtShortDateYear(date)}</strong><br><span class="muted">${fmtWeekdayShort(date)}</span></td>
        <td title="${fullNames}">${names.length ? `<span class="subj-inline">${shown}${more}</span>` : '<span class="muted">—</span>'}</td>
        <td>${l.hours ? fmtHours(l.hours) : '—'}</td>
        <td>${l.questions ? fmtInt(l.questions) : '—'}</td>
        <td>${acc === null ? '—' : `<span class="acc ${accClass}">${acc}%</span>`}</td>
        <td class="notes-cell" title="${esc(l.notes)}">${l.notes.trim() ? esc(truncate(l.notes, 56)) : '<span class="muted">—</span>'}</td>
      </tr>`;
    })
    .join('');

  $('#historyBody').innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Data</th><th>Matérias</th><th>Horas</th><th>Questões</th><th>Acertos</th><th>Anotações</th></tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
}
