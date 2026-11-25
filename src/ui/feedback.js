import { $ } from '../core/dom.js';

let savedTimer = null;

export function flashSaved() {
  const logState = $('#saveState');
  const logText = $('#saveText');
  const global = $('#globalSave');
  const globalText = $('#globalSaveText');
  if (logState) logState.classList.add('on');
  if (logText) logText.textContent = 'Salvo agora';
  if (global) global.classList.add('on');
  if (globalText) globalText.textContent = 'Salvo agora';
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => {
    if (logState) logState.classList.remove('on');
    if (logText) logText.textContent = 'Salvo automaticamente';
    if (global) global.classList.remove('on');
    if (globalText) globalText.textContent = 'Salvo';
  }, 1500);
}

export function toast(msg) {
  const box = $('#toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 260);
  }, 2800);
}
