import { $$ } from '../core/dom.js';
import { CRONO_TABS, PERF_TABS, VIEWS } from '../core/constants.js';
import { uiState } from '../core/ui-state.js';
import { populateSettings } from './settings.js';
import { renderHistory } from './history.js';
import { renderGoals, renderFullPlan, renderSchedule } from './schedule.js';
import { renderHero } from './profile.js';
import { renderChart, renderHeatmap, renderSubjects } from './performance.js';
import { renderSimulados } from './simulados.js';
import { renderTaf } from './taf.js';

export function showCronoTab(name) {
  if (!CRONO_TABS.has(name)) name = 'semana';
  uiState.cronoTab = name;
  $$('#view-cronograma .subview').forEach((v) =>
    v.classList.toggle('active', v.id === 'crono-' + name),
  );
  $$('#view-cronograma .subnav button').forEach((b) =>
    b.classList.toggle('active', b.dataset.cronoTab === name),
  );
}

export function showPerfTab(name) {
  if (!PERF_TABS.has(name)) name = 'evolucao';
  uiState.perfTab = name;
  $$('#view-desempenho .subview').forEach((v) =>
    v.classList.toggle('active', v.id === 'perf-' + name),
  );
  $$('#view-desempenho .subnav button').forEach((b) =>
    b.classList.toggle('active', b.dataset.perfTab === name),
  );
}

export function showView(name, updateHash = true, scrollTop = true) {
  if (!VIEWS.has(name)) name = 'hoje';
  uiState.currentView = name;
  $$('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
  $$('.nav-item[data-view], .mobile-tab[data-view]').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === name);
  });
  if (updateHash) {
    try {
      if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
    } catch {
      /* A URL hash é opcional; alguns navegadores bloqueiam replaceState em file://. */
    }
  }
  if (name === 'ajustes') populateSettings();
  if (name === 'historico') renderHistory();
  if (name === 'cronograma') {
    renderSchedule();
    renderFullPlan();
    renderGoals();
  }
  if (name === 'desempenho') {
    renderHero();
    renderHeatmap();
    renderSubjects();
    renderChart();
    renderSimulados();
    renderTaf();
  }
  if (scrollTop) window.scrollTo({ top: 0, behavior: 'smooth' });
}
