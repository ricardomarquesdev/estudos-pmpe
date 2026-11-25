import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  diffDays,
  fmtShortDate,
  isISO,
  mondayOf,
  parseISO,
  toISO,
} from '../src/core/dates.js';

test('converte ISO para Date local e volta', () => {
  const date = parseISO('2026-11-23');
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 10);
  assert.equal(date.getDate(), 23);
  assert.equal(toISO(date), '2026-11-23');
});

test('soma e calcula diferença entre datas', () => {
  assert.equal(addDays('2026-11-23', 1), '2026-11-24');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(diffDays('2026-11-23', '2027-02-21'), 90);
  assert.equal(diffDays('2027-02-21', '2026-11-23'), -90);
});

test('encontra a segunda-feira da semana', () => {
  assert.equal(mondayOf('2026-11-23'), '2026-11-23');
  assert.equal(mondayOf('2026-11-29'), '2026-11-23');
});

test('valida datas ISO reais', () => {
  assert.equal(isISO('2026-11-23'), true);
  assert.equal(isISO('2026-02-30'), false);
  assert.equal(isISO('23/11/2026'), false);
});

test('formata data curta em pt-BR', () => {
  assert.equal(fmtShortDate('2026-11-23'), '23/11');
});
