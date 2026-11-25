import { LOCALE } from './constants.js';

export function tafKind(id, profile) {
  if (id === 'barra') return profile === 'f' ? 'time' : 'reps';
  if (id === 'salto') return 'meters';
  if (id === 'abdominal') return 'reps';
  return 'time';
}

export function tafParse(value, kind) {
  if (kind === 'time') {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const match = String(value ?? '')
      .trim()
      .match(/^(\d{1,3}):([0-5]?\d)$/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }
  const text = String(value ?? '')
    .replace(',', '.')
    .trim();
  if (!text) return null;
  const number = Number(text);
  if (!Number.isFinite(number) || number < 0) return null;
  return kind === 'reps' ? Math.round(number) : Math.round(number * 100) / 100;
}

export function tafFormat(value, kind) {
  if (kind === 'time') {
    const seconds = typeof value === 'number' ? value : tafParse(value, 'time');
    if (seconds == null) return '—';
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
  if (kind === 'meters') {
    const number = typeof value === 'number' ? value : tafParse(value, 'meters');
    return number == null
      ? '—'
      : `${number.toLocaleString(LOCALE, { maximumFractionDigits: 2 })} m`;
  }
  const number = typeof value === 'number' ? value : tafParse(value, 'reps');
  return number == null ? '—' : `${number} reps`;
}

export function tafKindLabel(kind) {
  if (kind === 'time') return 'mm:ss';
  if (kind === 'meters') return 'metros';
  return 'repetições';
}
