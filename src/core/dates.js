import { LOCALE } from './constants.js';

export const MS_DAY = 86_400_000;
export const pad = (value) => String(value).padStart(2, '0');

export function parseISO(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO() {
  return toISO(new Date());
}

export function addDays(value, amount) {
  const date = parseISO(value);
  date.setDate(date.getDate() + amount);
  return toISO(date);
}

export function diffDays(start, end) {
  return Math.round((parseISO(end) - parseISO(start)) / MS_DAY);
}

export function isISO(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseISO(value);
  return !Number.isNaN(date.getTime()) && toISO(date) === value;
}

export function mondayOf(value) {
  const date = parseISO(value);
  const weekday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - weekday);
  return toISO(date);
}

export function relDay(value) {
  const difference = diffDays(value, todayISO());
  if (difference === 0) return 'hoje';
  if (difference === 1) return 'ontem';
  if (difference > 1) return `há ${difference} dias`;
  return 'em breve';
}

const fmtLongD = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});
const fmtShortD = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit' });
const fmtShortY = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const fmtWeekday = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' });
const fmtHuman = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});
const fmtFullD = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export const cap = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);
export const fmtDateLong = (value) => fmtLongD.format(parseISO(value));
export const fmtShortDate = (value) => fmtShortD.format(parseISO(value));
export const fmtShortDateYear = (value) => fmtShortY.format(parseISO(value));
export const fmtWeekdayShort = (value) => fmtWeekday.format(parseISO(value));
export const fmtHumanDate = (value) => fmtHuman.format(parseISO(value));
export const fmtFullDate = (value) => fmtFullD.format(parseISO(value));
export const fmtHours = (value) =>
  `${(Number(value) || 0).toLocaleString(LOCALE, { maximumFractionDigits: 1 })}h`;
export const fmtNum = (value) =>
  (Number(value) || 0).toLocaleString(LOCALE, { maximumFractionDigits: 1 });
export const fmtInt = (value) => (Number(value) || 0).toLocaleString(LOCALE);
