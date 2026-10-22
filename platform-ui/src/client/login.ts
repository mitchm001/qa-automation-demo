import { ApiClient, ApiError } from './classes/ApiClient.js';
import { HOME_PAGE } from './constants/ui.constants.js';
import { requireElement } from './helpers/dom.helpers.js';

/** The login page: checks the two fields, logs in, and goes to the event page. */

const api = new ApiClient();
const form = requireElement<HTMLFormElement>('#login-form');
const username = requireElement<HTMLInputElement>('#username');
const password = requireElement<HTMLInputElement>('#password');
const loginError = requireElement<HTMLElement>('#login-error');

const FIELDS = [
  { input: username, message: 'Username is required.' },
  { input: password, message: 'Password is required.' },
];

function setFieldError(input: HTMLInputElement, message: string): void {
  if (message) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
  requireElement<HTMLElement>(`[data-error-for="${input.name}"]`).textContent = message;
}

/** Shows "… is required." under any empty field. Returns true when both are filled in. */
function validate(): boolean {
  let valid = true;
  for (const { input, message } of FIELDS) {
    const empty = input.value.trim() === '';
    setFieldError(input, empty ? message : '');
    if (empty) valid = false;
  }
  form.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
  return valid;
}

for (const { input } of FIELDS) input.addEventListener('input', () => setFieldError(input, ''));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';
  if (!validate()) return;

  try {
    await api.logIn(username.value.trim(), password.value);
    window.location.assign(HOME_PAGE);
  } catch (error) {
    loginError.textContent = error instanceof ApiError ? error.message : 'Could not reach the server. Please try again.';
    password.value = '';
    password.focus();
  }
});

/** Already logged in (e.g. opened the login page directly): go straight to the event page. */
api
  .me()
  .then(() => window.location.assign(HOME_PAGE))
  .catch(() => undefined);
