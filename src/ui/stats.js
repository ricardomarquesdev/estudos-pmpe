import { $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { fmtInt, fmtNum } from '../core/dates.js';
import { getStats } from '../services/stats.js';

export function renderStats() {
  const s = getStats(state);
  $('#statDays').textContent = fmtInt(s.studiedDays);
  $('#statDaysSub').textContent = s.windowDays
    ? `${Math.round(s.consistency * 100)}% dos dias desde o início`
    : 'janela de estudo ainda não começou';

  $('#statStreak').innerHTML =
    `${fmtInt(s.streak)} <small>${s.streak === 1 ? 'dia' : 'dias'}</small>`;
  $('#statStreakSub').textContent =
    s.streak > 0 ? `recorde: ${s.best} ${s.best === 1 ? 'dia' : 'dias'}` : 'comece hoje';

  $('#statHours').innerHTML = `${fmtNum(s.totalHours)}<small>h</small>`;
  $('#statHoursSub').textContent = s.studiedDays
    ? `média de ${fmtNum(s.totalHours / s.studiedDays)}h por dia estudado`
    : 'nenhuma hora registrada';

  $('#statQuestions').textContent = fmtInt(s.totalQ);
  $('#statQuestionsSub').textContent = s.totalQ
    ? `aproveitamento de ${s.acc}%`
    : 'sem questões registradas';
}
