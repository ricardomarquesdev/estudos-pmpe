let uidSequence = 0;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function round1(value) {
  return Math.round(value * 10) / 10;
}

export function uid(prefix = 'id') {
  uidSequence += 1;
  return `${prefix}_${Date.now().toString(36)}_${uidSequence}`;
}

export function esc(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
}

export function truncate(value, length) {
  const text = String(value);
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text;
}

export function tint(hex, alpha) {
  const number = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(number >> 16) & 255},${(number >> 8) & 255},${number & 255},${alpha})`;
}

export function initials(name) {
  return (
    (name || 'Estudante')
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'M'
  );
}

export function greetingPrefix() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
