import { SUBJECTS, SUB_BY_ID, VIEWS } from './core/constants.js';
import { addDays, diffDays, isISO, todayISO } from './core/dates.js';
import { $, $$, download } from './core/dom.js';
import { ensureLog, persist, replaceState, state } from './core/state.js';
import { uiState } from './core/ui-state.js';
import { clamp, round1 } from './core/utils.js';
import { buildBackup, buildCsv, parseBackup } from './services/backup.js';
import { createPlan, isPlanValid } from './services/plan.js';
import { flashSaved, toast } from './ui/feedback.js';
import { initHistoryFilter, renderHistory } from './ui/history.js';
import { buildChips, renderLog, syncChips, updateLogSummary } from './ui/log.js';
import { showCronoTab, showPerfTab, showView } from './ui/navigation.js';
import { renderChart, renderHeatmap, renderReview, renderSubjects } from './ui/performance.js';
import { renderHero, renderProfile } from './ui/profile.js';
import { renderFullPlan, renderGoals, renderSchedule } from './ui/schedule.js';
import { populateSettings } from './ui/settings.js';
import { addSimulado, deleteSimulado, renderSimulados, resetSimForm } from './ui/simulados.js';
import { renderStats } from './ui/stats.js';
import {
  addTafSession,
  applyTafProfile,
  deleteTafSession,
  initTafForm,
  populateTafConfig,
  renderTaf,
  saveTafConfig,
  updateTafFormHint,
} from './ui/taf.js';

let refreshTimer = null;
let bootToday = todayISO();
let storageErrorShown = false;

function ensurePlan(force = false) {
  const today = todayISO();
  if (!force && isPlanValid(state.plan, state, today)) return;
  state.plan = today < state.examDate ? createPlan(state, today) : null;
  persist();
}

function commit(date) {
  const log = state.logs[date];
  if (log) {
    log.subjects = [...new Set((log.subjects || []).filter((id) => SUB_BY_ID[id]))];
    log.hours = round1(clamp(Number(log.hours) || 0, 0, 24));
    log.questions = Math.max(0, Math.floor(Number(log.questions) || 0));
    log.correct = Math.max(0, Math.floor(Number(log.correct) || 0));
    if (log.questions > 0 && log.correct > log.questions) log.correct = log.questions;
    log.notes = String(log.notes || '').slice(0, 3000);
    if (!log.subjects.length && !log.hours && !log.questions && !log.correct && !log.notes.trim()) {
      delete state.logs[date];
    }
  }
  persist();
  flashSaved();
  if (date === uiState.selectedDate) updateLogSummary();
  scheduleRefresh();
}

function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    renderProfile();
    renderHero();
    renderStats();
    renderSchedule();
    renderFullPlan();
    renderGoals();
    renderHeatmap();
    renderReview();
    renderSubjects();
    renderChart();
    renderHistory();
  }, 260);
}

function renderAll() {
  renderProfile();
  renderHero();
  renderStats();
  renderSchedule();
  renderFullPlan();
  renderGoals();
  renderHeatmap();
  renderReview();
  renderSubjects();
  renderChart();
  renderHistory();
  renderSimulados();
  renderTaf();
}

function toggleSubject(id) {
  const log = ensureLog(uiState.selectedDate);
  if (log.subjects.includes(id)) {
    log.subjects = log.subjects.filter((item) => item !== id);
  } else {
    log.subjects.push(id);
  }
  commit(uiState.selectedDate);
  syncChips();
}

function addToToday(id, scrollToLog = true) {
  const today = todayISO();
  uiState.selectedDate = today;
  const log = ensureLog(today);
  if (!log.subjects.includes(id)) log.subjects.push(id);
  commit(today);
  renderLog();
  if (scrollToLog && uiState.currentView === 'hoje') {
    setTimeout(() => $('#logCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 70);
  }
  toast(`${SUB_BY_ID[id]?.short || 'Matéria'} marcada no dia de hoje ✓`);
}

function openDate(date) {
  if (date > todayISO()) return;
  uiState.selectedDate = date;
  showView('hoje', true, false);
  renderLog();
  setTimeout(() => $('#logCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 90);
}

function saveSettings() {
  const name = $('#setName').value.trim().slice(0, 30) || 'Estudante';
  const exam = $('#setExam').value;
  const start = $('#setStart').value;
  const goal = clamp(Number.parseFloat($('#setGoal').value) || 3, 0.5, 16);
  if (!isISO(exam) || !isISO(start)) {
    toast('Preencha as duas datas corretamente.');
    return;
  }
  if (diffDays(start, exam) <= 0) {
    toast('A data da prova precisa ser depois do início.');
    return;
  }
  const examChanged = state.examDate !== exam;
  state.name = name;
  state.examDate = exam;
  state.startDate = start;
  state.dailyGoal = goal;
  ensurePlan(examChanged);
  persist();
  renderAll();
  renderLog();
  populateSettings();
  flashSaved();
  toast('Ajustes salvos ✓');
}

function saveGoals() {
  const next = {};
  for (const subject of SUBJECTS) {
    const input = $('#goal-' + subject.id);
    const value = Math.floor(Number(input?.value));
    if (!Number.isFinite(value) || value < 1 || value > 60) {
      toast('As metas devem ficar entre 1 e 60 dias.');
      input?.focus();
      return;
    }
    next[subject.id] = value;
  }
  state.goals = next;
  persist();
  renderAll();
  flashSaved();
  toast('Metas por matéria salvas ✓');
}

function regeneratePlan() {
  if (todayISO() >= state.examDate) {
    toast('A data da prova precisa ser futura para gerar o plano.');
    return;
  }
  if (
    !confirm('Regerar o plano de hoje até a véspera da prova? Os dias futuros serão recalculados.')
  ) {
    return;
  }
  ensurePlan(true);
  persist();
  renderAll();
  showCronoTab('plano');
  flashSaved();
  toast('Plano até a prova gerado ✓');
}

function exportCsv() {
  const csv = buildCsv(state);
  if (!csv) {
    toast('Nenhum registro para exportar ainda.');
    return;
  }
  download(`pmpe-estudos-${todayISO()}.csv`, csv, 'text/csv;charset=utf-8');
  toast('Planilha exportada ✓');
}

function exportJson() {
  download(`pmpe-backup-${todayISO()}.json`, buildBackup(state), 'application/json');
  toast('Backup gerado ✓');
}

function resetData() {
  if (
    !confirm(
      'Apagar registros de estudo, simulados e treinos do TAF? Seu nome, datas, metas e plano serão mantidos.',
    )
  ) {
    return;
  }
  state.logs = {};
  state.simulados = [];
  state.taf.sessions = [];
  uiState.historyFilter = 'all';
  persist();
  uiState.selectedDate = todayISO();
  const select = $('#historySubject');
  if (select) select.value = 'all';
  renderAll();
  renderLog();
  populateSettings();
  toast('Registros apagados.');
}

async function importBackup(file) {
  try {
    const text = await file.text();
    const data = parseBackup(text);
    if (!confirm('Importar este backup e substituir os dados atuais?')) return;
    replaceState(data);
    ensurePlan();
    persist();
    uiState.historyFilter = 'all';
    uiState.selectedDate = todayISO();
    const select = $('#historySubject');
    if (select) select.value = 'all';
    renderAll();
    renderLog();
    populateSettings();
    toast('Backup importado ✓');
  } catch {
    toast('Não consegui ler este arquivo.');
  }
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const nav = event.target.closest('[data-view]');
    if (!nav) return;
    const name = nav.dataset.view;
    if (!VIEWS.has(name)) return;
    event.preventDefault();
    if (name === 'hoje') {
      uiState.selectedDate = todayISO();
      renderLog();
    }
    const gotoLog = nav.hasAttribute('data-goto-log');
    showView(name, true, !gotoLog);
    if (nav.dataset.cronoTab) showCronoTab(nav.dataset.cronoTab);
    if (nav.dataset.perfTab) showPerfTab(nav.dataset.perfTab);
    if (gotoLog && name === 'hoje') {
      setTimeout(() => $('#logCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 90);
    }
  });

  document.addEventListener('click', (event) => {
    const cronoTabBtn = event.target.closest('[data-crono-tab]');
    if (cronoTabBtn && !cronoTabBtn.dataset.view) {
      event.preventDefault();
      showCronoTab(cronoTabBtn.dataset.cronoTab);
    }
    const perfTabBtn = event.target.closest('[data-perf-tab]');
    if (perfTabBtn && !perfTabBtn.dataset.view) {
      event.preventDefault();
      showPerfTab(perfTabBtn.dataset.perfTab);
    }
    if (event.target.closest('[data-generate-plan]')) regeneratePlan();
  });

  $('#subjectGrid').addEventListener('click', (event) => {
    const chip = event.target.closest('.subject');
    if (chip) toggleSubject(chip.dataset.id);
  });

  $('#prevDay').addEventListener('click', () => {
    uiState.selectedDate = addDays(uiState.selectedDate, -1);
    renderLog();
  });
  $('#nextDay').addEventListener('click', () => {
    if (uiState.selectedDate < todayISO()) {
      uiState.selectedDate = addDays(uiState.selectedDate, 1);
      renderLog();
    }
  });
  $('#todayBtn').addEventListener('click', () => {
    uiState.selectedDate = todayISO();
    renderLog();
  });
  $('#logDate').addEventListener('change', (event) => {
    const value = event.target.value;
    if (!isISO(value)) return;
    if (value > todayISO()) {
      event.target.value = todayISO();
      uiState.selectedDate = todayISO();
      toast('Não dá para registrar um dia futuro.');
      renderLog();
      return;
    }
    uiState.selectedDate = value;
    renderLog();
  });

  $('#hours').addEventListener('input', (event) => {
    const log = ensureLog(uiState.selectedDate);
    log.hours = round1(clamp(Number.parseFloat(event.target.value.replace(',', '.')) || 0, 0, 24));
    commit(uiState.selectedDate);
  });
  $('#questions').addEventListener('input', (event) => {
    const log = ensureLog(uiState.selectedDate);
    log.questions = Math.max(0, Math.floor(Number(event.target.value) || 0));
    if (log.questions > 0 && log.correct > log.questions) {
      log.correct = log.questions;
      $('#correct').value = log.correct ? String(log.correct) : '';
    }
    commit(uiState.selectedDate);
  });
  $('#correct').addEventListener('input', (event) => {
    const log = ensureLog(uiState.selectedDate);
    log.correct = Math.max(0, Math.floor(Number(event.target.value) || 0));
    commit(uiState.selectedDate);
  });
  ['hours', 'questions'].forEach((id) => {
    $('#' + id).addEventListener('blur', () => {
      const log = state.logs[uiState.selectedDate];
      const value = log ? log[id] : 0;
      $('#' + id).value = value ? String(value) : '';
    });
  });
  $('#correct').addEventListener('blur', () => {
    const log = state.logs[uiState.selectedDate];
    if (!log) {
      $('#correct').value = '';
      return;
    }
    if (log.questions > 0 && log.correct > log.questions) {
      log.correct = log.questions;
      commit(uiState.selectedDate);
    }
    $('#correct').value = log.correct ? String(log.correct) : '';
  });
  $('#notes').addEventListener('input', (event) => {
    const log = ensureLog(uiState.selectedDate);
    log.notes = event.target.value;
    commit(uiState.selectedDate);
  });

  $('#focusBtn').addEventListener('click', () => {
    const button = $('#focusBtn');
    const id = button.dataset.id;
    if (!id) return;
    if (button.dataset.done === '1') {
      $('#logCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      addToToday(id, true);
    }
  });
  $('#planStrip').addEventListener('click', (event) => {
    const button = event.target.closest('[data-plan-add]');
    if (button) addToToday(button.dataset.planAdd, false);
  });
  $('#reviewList').addEventListener('click', (event) => {
    const button = event.target.closest('[data-add]');
    if (button) addToToday(button.dataset.add, true);
  });
  $('#subjectStats').addEventListener('click', (event) => {
    const row = event.target.closest('.subject-row');
    if (row) addToToday(row.dataset.subject, false);
  });

  $('#heatGrid').addEventListener('click', (event) => {
    const cell = event.target.closest('.heat-cell[data-date]');
    if (cell) openDate(cell.dataset.date);
  });

  $('#saveGoals').addEventListener('click', saveGoals);
  $('#fullPlanWeeks').addEventListener('click', (event) => {
    const row = event.target.closest('[data-plan-date]');
    if (row) openDate(row.dataset.planDate);
  });

  $('#addSimulado').addEventListener('click', addSimulado);
  $('#simList').addEventListener('click', (event) => {
    const button = event.target.closest('[data-del-sim]');
    if (button) deleteSimulado(button.dataset.delSim);
  });

  $('#toggleTafConfig').addEventListener('click', () => {
    const config = $('#tafConfig');
    const opening = config.hidden;
    if (opening) populateTafConfig();
    config.hidden = !opening;
    $('#toggleTafConfig').textContent = opening ? 'Fechar metas' : 'Ajustar metas';
  });
  $('#closeTafConfig').addEventListener('click', () => {
    $('#tafConfig').hidden = true;
    $('#toggleTafConfig').textContent = 'Ajustar metas';
  });
  $('#tafProfileSelect').addEventListener('change', (event) => {
    applyTafProfile(event.target.value);
  });
  $('#saveTafConfig').addEventListener('click', saveTafConfig);
  $('#tafExercise').addEventListener('change', updateTafFormHint);
  $('#addTafSession').addEventListener('click', addTafSession);
  $('#tafSessions').addEventListener('click', (event) => {
    const button = event.target.closest('[data-del-taf]');
    if (button) deleteTafSession(button.dataset.delTaf);
  });
  $('#tafCards').addEventListener('click', (event) => {
    const button = event.target.closest('[data-taf-pick]');
    if (!button) return;
    $('#tafExercise').value = button.dataset.tafPick;
    updateTafFormHint();
    $('#tafSessionForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => $('#tafResult')?.focus(), 220);
  });

  $('#historyBody').addEventListener('click', (event) => {
    if (event.target.closest('[data-history-all]')) {
      uiState.historyFilter = 'all';
      const select = $('#historySubject');
      if (select) select.value = 'all';
      renderHistory();
      return;
    }
    const row = event.target.closest('tr[data-date]');
    if (row) openDate(row.dataset.date);
  });
  $('#historySubject').addEventListener('change', (event) => {
    uiState.historyFilter = event.target.value;
    renderHistory();
  });

  $('#saveSettings').addEventListener('click', saveSettings);
  $$('.js-export-csv').forEach((button) => button.addEventListener('click', exportCsv));
  $$('.js-export-json').forEach((button) => button.addEventListener('click', exportJson));
  $('#resetBtn').addEventListener('click', resetData);
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) importBackup(file);
    event.target.value = '';
  });

  window.addEventListener('hashchange', () => {
    const name = (location.hash || '#hoje').replace('#', '');
    if (VIEWS.has(name) && name !== uiState.currentView) showView(name, false, false);
  });

  setInterval(() => {
    const current = todayISO();
    if (current !== bootToday) {
      bootToday = current;
      if (uiState.selectedDate > current) uiState.selectedDate = current;
      renderAll();
      renderLog();
    }
  }, 60_000);
}

export function init() {
  window.addEventListener('app:storage-error', () => {
    if (storageErrorShown) return;
    storageErrorShown = true;
    toast('Não consegui salvar neste navegador. Use “Baixar backup” para guardar seus dados.');
  });

  buildChips();
  initHistoryFilter();
  ensurePlan();
  initTafForm();
  resetSimForm();
  bindEvents();
  renderAll();
  renderLog();
  showCronoTab(uiState.cronoTab);
  showPerfTab(uiState.perfTab);

  const initialHash = (location.hash || '').replace('#', '');
  showView(VIEWS.has(initialHash) ? initialHash : 'hoje', false, false);
}
