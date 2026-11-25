import test from 'node:test';
import assert from 'node:assert/strict';
import { getStats, hasStudy, logHasSubject, subjectDays } from '../src/services/stats.js';
import { log, makeState, TODAY } from './helpers.js';

function studiedState() {
  return makeState({
    startDate: '2026-11-20',
    logs: {
      '2026-11-20': log(['portugues'], 2, 10, 7),
      '2026-11-21': log(['rlm'], 1, 5, 4),
      '2026-11-22': log(['historia'], 2, 10, 8),
      '2026-11-23': log(['portugues'], 3, 10, 8),
    },
  });
}

test('identifica dias com estudo', () => {
  assert.equal(hasStudy(log(['portugues'], 0)), true);
  assert.equal(hasStudy(log([], 0.5)), true);
  assert.equal(hasStudy(log([], 0, 3)), true);
  assert.equal(hasStudy(log([], 0, 0, 0, 'só anotação')), false);
});

test('calcula resumo, sequência e aproveitamento', () => {
  const stats = getStats(studiedState(), TODAY);
  assert.equal(stats.studiedDays, 4);
  assert.equal(stats.streak, 4);
  assert.equal(stats.best, 4);
  assert.equal(stats.totalHours, 8);
  assert.equal(stats.totalQ, 35);
  assert.equal(stats.acc, 77);
  assert.equal(stats.windowDays, 4);
  assert.equal(stats.consistency, 1);
});

test('conta dias e última ocorrência por matéria', () => {
  const rows = subjectDays(studiedState());
  const portugues = rows.find((row) => row.id === 'portugues');
  const historia = rows.find((row) => row.id === 'historia');
  assert.equal(portugues.days, 2);
  assert.equal(portugues.last, TODAY);
  assert.equal(historia.days, 1);
  assert.equal(historia.last, '2026-11-22');
});

test('consulta matéria e existência de registro', () => {
  const state = studiedState();
  assert.equal(logHasSubject(state, TODAY, 'portugues'), true);
  assert.equal(logHasSubject(state, TODAY, 'historia'), false);
});
