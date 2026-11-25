import test from 'node:test';
import assert from 'node:assert/strict';
import { simMaxPoints, simPercent, simTotalPoints } from '../src/services/simulados.js';

test('soma nota da objetiva e redação', () => {
  assert.equal(simTotalPoints({ correct: 42, essay: 32 }), 74);
  assert.equal(simMaxPoints({ questions: 60, essay: 32 }), 100);
  assert.equal(simPercent({ questions: 60, correct: 42, essay: 32 }), 74);
});

test('calcula percentual só da objetiva quando não há redação', () => {
  assert.equal(simPercent({ questions: 60, correct: 45, essay: null }), 75);
  assert.equal(simMaxPoints({ questions: 30, essay: null }), 30);
});

test('lida com simulado vazio', () => {
  assert.equal(simPercent({ questions: 0, correct: 0, essay: null }), 0);
});
