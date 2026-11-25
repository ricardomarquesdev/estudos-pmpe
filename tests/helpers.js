import { DEFAULT_GOALS, TAF_PRESETS } from '../src/core/constants.js';
import { defaultState } from '../src/core/state.js';

export const TODAY = '2026-11-23';

export function makeState(overrides = {}) {
  return {
    ...defaultState(),
    examDate: '2027-02-21',
    startDate: '2026-11-01',
    goals: { ...DEFAULT_GOALS },
    logs: {},
    plan: null,
    simulados: [],
    taf: {
      date: '2027-07-23',
      profile: 'm',
      targets: { ...TAF_PRESETS.m },
      sessions: [],
    },
    ...overrides,
  };
}

export function log(subjects = [], hours = 0, questions = 0, correct = 0, notes = '') {
  return { subjects, hours, questions, correct, notes };
}
