import test from 'node:test';
import assert from 'node:assert/strict';
import { tafFormat, tafKind, tafParse } from '../src/core/taf.js';
import { tafStats } from '../src/services/taf.js';

test('interpreta e formata tempos, metros e repetições', () => {
  assert.equal(tafParse('11:30', 'time'), 690);
  assert.equal(tafParse('1:00', 'time'), 60);
  assert.equal(tafParse('3,6', 'meters'), 3.6);
  assert.equal(tafParse('40', 'reps'), 40);
  assert.equal(tafParse('inválido', 'time'), null);
  assert.equal(tafFormat(690, 'time'), '11:30');
  assert.equal(tafFormat(3.6, 'meters'), '3,6 m');
  assert.equal(tafFormat(40, 'reps'), '40 reps');
});

test('define tipo da barra por perfil', () => {
  assert.equal(tafKind('barra', 'm'), 'reps');
  assert.equal(tafKind('barra', 'f'), 'time');
  assert.equal(tafKind('corrida', 'm'), 'time');
});

test('calcula melhor, último e status do treino', () => {
  const taf = {
    profile: 'm',
    targets: { barra: '5' },
    sessions: [
      { date: '2026-11-14', exerciseId: 'barra', value: '4' },
      { date: '2026-11-07', exerciseId: 'barra', value: '3' },
    ],
  };
  const stats = tafStats(taf, 'barra');
  assert.equal(stats.best, 4);
  assert.equal(stats.target, 5);
  assert.equal(stats.status, 'Falta 1 rep');
  assert.equal(stats.progress, 80);
  assert.equal(stats.last.date, '2026-11-14');
});

test('considera meta batida e formato de tempo', () => {
  const taf = {
    profile: 'f',
    targets: { barra: '0:25' },
    sessions: [{ date: '2026-11-14', exerciseId: 'barra', value: '0:30' }],
  };
  const stats = tafStats(taf, 'barra');
  assert.equal(stats.kind, 'time');
  assert.equal(stats.status, 'Faltam 0:05');
  assert.equal(stats.met, false);
});
