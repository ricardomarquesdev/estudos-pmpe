import { $ } from '../core/dom.js';
import { state } from '../core/state.js';

export function populateSettings() {
  $('#setName').value = state.name || '';
  $('#setExam').value = state.examDate;
  $('#setStart').value = state.startDate;
  $('#setGoal').value = state.dailyGoal;
  const bytes = new Blob([JSON.stringify(state)]).size;
  const size =
    bytes < 1024 * 1024
      ? Math.max(1, Math.round(bytes / 1024)) + ' KB'
      : (bytes / 1024 / 1024).toFixed(1) + ' MB';
  $('#dataSize').textContent = size;
}
