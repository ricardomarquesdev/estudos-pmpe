import { $ } from '../core/dom.js';
import { TAF_EXERCISES, TAF_PRESETS } from '../core/constants.js';
import { state, persist } from '../core/state.js';
import { esc, uid } from '../core/utils.js';
import { tafFormat, tafKind, tafKindLabel, tafParse } from '../core/taf.js';
import { diffDays, fmtShortDate, fmtShortDateYear, isISO, todayISO } from '../core/dates.js';
import { tafStats } from '../services/taf.js';
import { flashSaved, toast } from './feedback.js';

export function updateTafFormHint() {
  const id = $('#tafExercise').value || 'corrida';
  const kind = tafKind(id, state.taf.profile);
  $('#tafResultHint').textContent =
    kind === 'time' ? 'formato mm:ss' : kind === 'meters' ? 'em metros, ex.: 3,6' : 'repetições';
  $('#tafResult').placeholder =
    kind === 'time' ? 'Ex.: 11:30' : kind === 'meters' ? 'Ex.: 3,6' : 'Ex.: 40';
}

export function tafTargetHint(id, profile) {
  const kind = tafKind(id, profile);
  const official = tafFormat(TAF_PRESETS[profile][id], kind);
  return `${tafKindLabel(kind)} · edital: ${official}`;
}

export function renderTaf() {
  const taf = state.taf;
  const today = todayISO();
  const days = diffDays(today, taf.date);
  $('#tafBannerDate').textContent = fmtShortDateYear(taf.date);
  $('#tafCountdown').textContent =
    days > 0 ? `Faltam ${days} dias` : days === 0 ? 'É hoje!' : 'Data já passou';
  $('#tafProfileLabel').textContent =
    taf.profile === 'f' ? 'Índices femininos' : 'Índices masculinos';

  $('#tafCards').innerHTML = TAF_EXERCISES.map((ex) => {
    const st = tafStats(state.taf, ex.id);
    const targetText =
      st.target == null
        ? '—'
        : st.kind === 'time'
          ? tafFormat(st.target, 'time')
          : tafFormat(st.target, st.kind);
    const bestText = st.best == null ? '—' : tafFormat(st.best, st.kind);
    const lastText = st.last ? tafFormat(st.last.num, st.kind) : '—';
    const lastDate = st.last ? fmtShortDate(st.last.date) : '';
    return `
      <article class="taf-card ${st.met ? 'done' : ''}">
        <div class="taf-card-top">
          <span class="taf-card-icon">${ex.icon}</span>
          <div><div class="taf-card-name">${ex.name}</div><div class="taf-card-sub">${tafKindLabel(st.kind)}</div></div>
        </div>
        <div class="taf-card-target">Meta <b>${targetText}</b></div>
        <div class="taf-card-stats">
          <span>Melhor <b>${bestText}</b></span>
          <span>Último <b>${lastText}</b>${lastDate ? `<small>${lastDate}</small>` : ''}</span>
        </div>
        <div class="taf-card-bar"><span style="width:${st.progress}%;background:${st.met ? 'var(--green)' : 'var(--blue)'}"></span></div>
        <div class="taf-card-status ${st.statusClass}">${st.status}</div>
        <button type="button" class="taf-pick" data-taf-pick="${ex.id}">Registrar</button>
      </article>`;
  }).join('');

  const sessions = [...taf.sessions].sort((a, b) => (a.date < b.date ? 1 : -1));
  $('#tafSessionCount').textContent =
    `${sessions.length} ${sessions.length === 1 ? 'treino' : 'treinos'}`;
  if (!sessions.length) {
    $('#tafSessions').innerHTML =
      '<div class="empty"><strong>Nenhum treino registrado</strong><p>Registre seu primeiro resultado no formulário ao lado.</p></div>';
  } else {
    $('#tafSessions').innerHTML = sessions
      .map((s) => {
        const ex = TAF_EXERCISES.find((e) => e.id === s.exerciseId);
        const kind = tafKind(s.exerciseId, taf.profile);
        const num = tafParse(s.value, kind);
        const display = num != null ? tafFormat(num, kind) : s.value;
        return `
        <div class="taf-session">
          <span class="taf-session-icon">${ex?.icon || '💪'}</span>
          <div class="taf-session-info">
            <b>${ex?.name || s.exerciseId}</b>
            <span>${fmtShortDateYear(s.date)}${s.notes ? ` · ${esc(s.notes)}` : ''}</span>
          </div>
          <strong>${display}</strong>
          <button type="button" class="taf-del" data-del-taf="${s.id}" aria-label="Apagar treino" title="Apagar treino">×</button>
        </div>`;
      })
      .join('');
  }
  updateTafFormHint();
}

export function populateTafConfig() {
  if (!$('#tafConfig')) return;
  $('#tafDateInput').value = state.taf.date;
  $('#tafProfileSelect').value = state.taf.profile;
  for (const ex of TAF_EXERCISES) {
    $('#tafTarget-' + ex.id).value = state.taf.targets[ex.id];
    $('#tafHint-' + ex.id).textContent = tafTargetHint(ex.id, state.taf.profile);
  }
}

export function initTafForm() {
  const select = $('#tafExercise');
  if (!select) return;
  select.innerHTML = TAF_EXERCISES.map((ex) => `<option value="${ex.id}">${ex.name}</option>`).join(
    '',
  );
  select.value = 'corrida';
  $('#tafSessionDate').value = todayISO();
  updateTafFormHint();
  populateTafConfig();
}

export function saveTafConfig() {
  const date = $('#tafDateInput').value;
  const profile = $('#tafProfileSelect').value === 'f' ? 'f' : 'm';
  if (!isISO(date)) {
    toast('Informe uma data válida para o TAF.');
    return;
  }
  const targets = {};
  for (const ex of TAF_EXERCISES) {
    const kind = tafKind(ex.id, profile);
    const value = $('#tafTarget-' + ex.id).value.trim();
    if (tafParse(value, kind) == null) {
      toast(`Confira a meta de ${ex.name}.`);
      $('#tafTarget-' + ex.id).focus();
      return;
    }
    targets[ex.id] = value;
  }
  state.taf.date = date;
  state.taf.profile = profile;
  state.taf.targets = targets;
  persist();
  renderTaf();
  populateTafConfig();
  $('#tafConfig').hidden = true;
  $('#toggleTafConfig').textContent = 'Ajustar metas';
  flashSaved();
  toast('Metas do TAF salvas ✓');
}

export function addTafSession() {
  const date = $('#tafSessionDate').value;
  if (!isISO(date) || date > todayISO()) {
    toast('Escolha uma data válida, até hoje.');
    return;
  }
  const exerciseId = $('#tafExercise').value;
  const kind = tafKind(exerciseId, state.taf.profile);
  const value = $('#tafResult').value.trim();
  if (tafParse(value, kind) == null) {
    toast('Confira o resultado no formato correto.');
    $('#tafResult').focus();
    return;
  }
  const notes = $('#tafSessionNotes').value.trim().slice(0, 500);
  state.taf.sessions.push({ id: uid('taf'), date, exerciseId, value, notes });
  persist();
  renderTaf();
  $('#tafSessionDate').value = todayISO();
  $('#tafResult').value = '';
  $('#tafSessionNotes').value = '';
  flashSaved();
  toast('Treino registrado ✓');
}

export function deleteTafSession(id) {
  if (!confirm('Apagar este treino do histórico?')) return;
  state.taf.sessions = state.taf.sessions.filter((s) => s.id !== id);
  persist();
  renderTaf();
  flashSaved();
  toast('Treino removido.');
}

export function applyTafProfile(profile) {
  const selectedProfile = profile === 'f' ? 'f' : 'm';
  for (const exercise of TAF_EXERCISES) {
    $('#tafTarget-' + exercise.id).value = TAF_PRESETS[selectedProfile][exercise.id];
    $('#tafHint-' + exercise.id).textContent = tafTargetHint(exercise.id, selectedProfile);
  }
}
