import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizePlan, sanitizeSimulado, sanitizeTaf, stateFrom } from '../src/core/state.js';

test('cria estado padrão com metas, TAF e plano vazio', () => {
  const state = stateFrom(null);
  assert.equal(state.version, 3);
  assert.equal(state.name, 'Márcio');
  assert.equal(state.examDate, '2027-02-21');
  assert.equal(state.goals.portugues, 12);
  assert.equal(state.plan, null);
  assert.deepEqual(state.simulados, []);
  assert.equal(state.taf.profile, 'm');
  assert.deepEqual(state.taf.sessions, []);
});

test('migra dados da versão anterior sem perder o diário', () => {
  const old = {
    version: 1,
    examDate: '2027-02-21',
    startDate: '2026-11-01',
    dailyGoal: 3,
    logs: {
      '2026-11-22': {
        subjects: ['constitucional', 'dh'],
        hours: 2.5,
        questions: 30,
        correct: 21,
        notes: 'Dados antigos',
      },
    },
  };
  const state = stateFrom(old);
  assert.equal(state.name, 'Márcio');
  assert.equal(state.logs['2026-11-22'].hours, 2.5);
  assert.equal(state.logs['2026-11-22'].subjects.length, 2);
  assert.equal(state.goals.portugues, 12);
  assert.equal(state.taf.profile, 'm');
  assert.equal(state.plan, null);
});

test('normaliza metas por matéria entre 1 e 60', () => {
  const state = stateFrom({
    goals: { portugues: 80, historia: 0, rlm: 'x', informatica: 20 },
  });
  assert.equal(state.goals.portugues, 60);
  assert.equal(state.goals.historia, 12);
  assert.equal(state.goals.rlm, 12);
  assert.equal(state.goals.informatica, 20);
});

test('sanitiza simulado e limita acertos/redação', () => {
  const sim = sanitizeSimulado({
    date: '2026-11-20',
    title: 'Simulado teste',
    questions: 60,
    correct: 80,
    essay: 50,
    minutes: -4,
    notes: '  ',
  });
  assert.equal(sim.correct, 60);
  assert.equal(sim.essay, 40);
  assert.equal(sim.minutes, 0);
  assert.equal(sanitizeSimulado({ date: 'inválida', questions: 60 }), null);
});

test('normaliza TAF com perfil e índices oficiais', () => {
  const taf = sanitizeTaf({
    date: '2027-07-24',
    profile: 'f',
    targets: { barra: '0:30', salto: '2,8', corrida: 'inválido' },
    sessions: [
      { date: '2026-11-20', exerciseId: 'corrida', value: '13:00' },
      { date: '2026-11-20', exerciseId: 'inexistente', value: '10:00' },
    ],
  });
  assert.equal(taf.profile, 'f');
  assert.equal(taf.targets.barra, '0:30');
  assert.equal(taf.targets.corrida, '13:30');
  assert.equal(taf.sessions.length, 1);
  assert.equal(taf.sessions[0].exerciseId, 'corrida');
});

test('sanitiza plano importado e descarta dias inválidos', () => {
  const plan = sanitizePlan({
    startDate: '2026-11-23',
    examDate: '2027-02-21',
    days: [
      { date: '2026-11-23', subject: 'portugues' },
      { date: '2026-11-23', subject: 'historia' },
      { date: '2026-11-24', subject: 'materia-inexistente' },
    ],
  });
  assert.equal(plan.days.length, 1);
  assert.equal(plan.days[0].subject, 'portugues');
});
