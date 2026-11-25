import { $ } from './core/dom.js';
import { sha256Hex } from './core/hash.js';

const SESSION_KEY = 'pmpe-auth-ok';
const expectedUser = (import.meta.env.VITE_APP_USER || '').trim();
const expectedHash = (import.meta.env.VITE_APP_PASSWORD_HASH || '').trim().toLowerCase();

function isUnlocked() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markUnlocked() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // O acesso continua válido apenas nesta página.
  }
}

export function logout() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Sem sessão persistida para limpar.
  }
  location.reload();
}

function bindLogout() {
  const button = $('#logoutBtn');
  if (button) button.addEventListener('click', logout);
}

export function bootstrapAuth(onAuthenticated) {
  let initialized = false;

  const start = () => {
    if (initialized) return;
    initialized = true;
    document.body.classList.remove('auth-pending');
    const gate = $('#authGate');
    if (gate) gate.hidden = true;
    bindLogout();
    onAuthenticated();
  };

  // Em desenvolvimento/CI sem as variáveis configuradas, não há bloqueio.
  if (!expectedUser || !expectedHash) {
    start();
    return;
  }

  if (isUnlocked()) {
    start();
    return;
  }

  const gate = $('#authGate');
  const form = $('#authForm');
  const userInput = $('#authUser');
  const passwordInput = $('#authPassword');
  const error = $('#authError');
  const submit = $('#authSubmit');

  if (!gate || !form || !userInput || !passwordInput || !error || !submit) {
    start();
    return;
  }

  gate.hidden = false;
  document.body.classList.add('auth-pending');
  setTimeout(() => userInput.focus(), 150);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';

    const username = userInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
      error.textContent = 'Preencha usuário e senha.';
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Verificando...';
    try {
      const hash = await sha256Hex(password);
      if (username === expectedUser && hash === expectedHash) {
        markUnlocked();
        start();
      } else {
        error.textContent = 'Usuário ou senha inválidos.';
        passwordInput.value = '';
        passwordInput.focus();
      }
    } catch {
      error.textContent = 'Não foi possível validar o acesso neste navegador.';
    } finally {
      submit.disabled = false;
      submit.textContent = 'Entrar';
    }
  });
}
