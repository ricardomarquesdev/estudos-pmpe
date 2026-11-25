import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPlan,
  fixedTask,
  isPlanValid,
  planMeta,
  planStatusFor,
} from '../src/services/plan.js';
import { log, makeState, TODAY } from './helpers.js';

test('cria plano de 90 dias até a véspera da prova', () => {
  const state = makeState();
  const plan = createPlan(state, TODAY);

  assert.ok(plan);
  assert.equal(plan.days.length, 90);
  assert.equal(plan.days[0].date, '2026-11-23');
  assert.equal(plan.days.at(-1).date, '2027-02-20');
  assert.equal(plan.cycle.length, 7);
  assert.equal(new Set(plan.cycle).size, 7);
});

test('cada semana completa tem as sete matérias uma vez', () => {
  const plan = createPlan(makeState(), TODAY);
  for (let week = 0; week < 12; week += 1) {
    const block = plan.days.slice(week * 7, week * 7 + 7).map((day) => day.subject);
    assert.equal(new Set(block).size, 7, `semana ${week + 1}`);
  }
});

test('valida plano existente e invalida quando a prova muda', () => {
  const state = makeState();
  const plan = createPlan(state, TODAY);
  assert.equal(isPlanValid(plan, state, TODAY), true);
  assert.equal(isPlanValid(plan, { ...state, examDate: '2027-03-01' }, TODAY), false);
  assert.equal(isPlanValid(null, state, TODAY), false);
});

test('gera metadados, tarefas e semanas do plano', () => {
  const plan = createPlan(makeState(), TODAY);
  const meta = planMeta(plan);
  assert.equal(meta.weeks, 13);
  assert.equal(meta.days.length, 90);
  for (const count of Object.values(meta.counts)) {
    assert.ok(count === 12 || count === 13);
  }

  const today = meta.byDate.get(TODAY);
  assert.equal(today.task, 'Teoria + 10 questões');

  const portuguesDays = meta.days.filter((day) => day.subject === 'portugues');
  assert.equal(portuguesDays[3].task, 'Revisão + 15 questões');
  assert.equal(portuguesDays[7].task, 'Simulado + revisão');
  assert.equal(fixedTask('redacao', 0), '1 redação completa');
  assert.equal(fixedTask('redacao', 3), 'Redação + correção');
});

test('calcula status do plano em relação ao diário', () => {
  const state = makeState({
    logs: {
      '2026-11-22': log(['portugues'], 1),
      '2026-11-21': log(['historia'], 1),
    },
  });

  assert.equal(planStatusFor(state, { date: TODAY, subject: 'portugues' }, TODAY), 'today');
  state.logs[TODAY] = log(['portugues'], 1);
  assert.equal(planStatusFor(state, { date: TODAY, subject: 'portugues' }, TODAY), 'done');
  assert.equal(planStatusFor(state, { date: '2026-11-22', subject: 'portugues' }, TODAY), 'done');
  assert.equal(planStatusFor(state, { date: '2026-11-21', subject: 'portugues' }, TODAY), 'other');
  assert.equal(planStatusFor(state, { date: '2026-11-20', subject: 'portugues' }, TODAY), 'missed');
  assert.equal(planStatusFor(state, { date: '2026-11-24', subject: 'portugues' }, TODAY), 'future');
});
