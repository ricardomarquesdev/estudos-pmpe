import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBackup, buildCsv, parseBackup } from '../src/services/backup.js';
import { log, makeState } from './helpers.js';

test('exporta CSV com cabeçalho, BOM e separador', () => {
  const state = makeState({
    logs: {
      '2026-11-23': log(['portugues', 'rlm'], 2.5, 20, 15, 'Revisão; anotação'),
    },
  });
  const csv = buildCsv(state);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /"Data";"Matérias";"Horas"/);
  assert.match(csv, /Língua Portuguesa \| Raciocínio Lógico/);
  assert.match(csv, /"2,5"/);
  assert.match(csv, /Revisão; anotação/);
});

test('não gera CSV sem registros', () => {
  assert.equal(buildCsv(makeState()), '');
});

test('backup JSON preserva e valida dados', () => {
  const state = makeState({ name: 'Teste', logs: { '2026-11-23': log(['portugues'], 1) } });
  const restored = parseBackup(buildBackup(state));
  assert.equal(restored.name, 'Teste');
  assert.equal(restored.logs['2026-11-23'].hours, 1);
  assert.throws(() => parseBackup('{}'));
  assert.throws(() => parseBackup('não é json'));
});
