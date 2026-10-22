import { ApiClient, ApiError } from './classes/ApiClient.js';
import { AttendeeLists } from './classes/AttendeeLists.js';
import { ConfirmDialog } from './classes/ConfirmDialog.js';
import { SeatPickerDialog } from './classes/SeatPickerDialog.js';
import { SignupForm } from './classes/SignupForm.js';
import { EVENT_ID, LOGIN_PAGE, MAX_PEOPLE_PER_SIGNUP } from './constants/ui.constants.js';
import { fullName, pluralize, requireElement } from './helpers/dom.helpers.js';
import type { AttendeeInput, EventSummary, Signup } from './types.js';

/** Wires the page together: the form, then the seat picker if needed, then the API, then the refreshed lists. */

const api = new ApiClient();
const statusMessage = requireElement<HTMLElement>('#status');

const form = new SignupForm(
  requireElement<HTMLFormElement>('#signup-form'),
  requireElement<HTMLElement>('#attendee-rows'),
  requireElement<HTMLButtonElement>('#add-person'),
  requireElement<HTMLElement>('#form-error'),
);
form.setMaxRows(MAX_PEOPLE_PER_SIGNUP);
const seatPicker = new SeatPickerDialog(requireElement<HTMLDialogElement>('#seat-picker'));
const confirmDialog = new ConfirmDialog(requireElement<HTMLDialogElement>('#confirm-dialog'));
const lists = new AttendeeLists(removeSignup, clearWaitlist, removeAllConfirmed);

function showStatus(message: string, kind: 'success' | 'error' = 'success'): void {
  statusMessage.textContent = message;
  statusMessage.dataset.kind = kind;
}

async function refresh(): Promise<EventSummary> {
  const [latestEvent, signups] = await Promise.all([api.getEvent(EVENT_ID), api.listSignups(EVENT_ID)]);
  lists.render(latestEvent, signups);
  return latestEvent;
}

/** Works out who to send to the API, and in what order (people who get seats first). */
async function chooseWhoToSend(people: AttendeeInput[]): Promise<number[] | null> {
  const allRows = people.map((_, index) => index);
  const { seatsAvailable } = await refresh();
  if (people.length <= seatsAvailable) return allRows;

  const choice = await seatPicker.open(people, seatsAvailable);
  if (!choice) return null;

  return [...choice.seatedIndexes, ...choice.waitlistIndexes];
}

form.onSubmit(async (people) => {
  form.clearErrors();
  showStatus('');
  if (!form.validate()) return; /** fix the highlighted fields first; the seat picker never opens */

  try {
    const rowOrder = await chooseWhoToSend(people);
    if (!rowOrder) return; /** seat picker cancelled: leave the form as it was */

    try {
      const result = await api.signUp(EVENT_ID, rowOrder.map((row) => people[row]));
      const confirmed = result.signups.filter((s) => s.status === 'confirmed').length;
      const waitlisted = result.signups.length - confirmed;
      form.reset();
      showStatus(`Signed up ${pluralize(result.signups.length, 'person', 'people')}: ${confirmed} confirmed, ${waitlisted} waitlisted.`);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      form.showFieldErrors(error.fieldErrors, rowOrder);
      form.showFormError(error.message);
    }
  } catch {
    showStatus('Could not reach the server. Please try again.', 'error');
  } finally {
    await refresh().catch(() => undefined);
  }
});

async function removeSignup(signup: Signup): Promise<void> {
  try {
    const { promoted } = await api.removeSignup(EVENT_ID, signup.id);
    const promotedNote = promoted ? ` ${fullName(promoted)} moved from the waitlist into the open seat.` : '';
    showStatus(`Removed ${fullName(signup)}.${promotedNote}`);
  } catch (error) {
    showStatus(error instanceof ApiError ? error.message : 'Could not reach the server.', 'error');
  }
  await refresh().catch(() => undefined);
}

async function removeAllConfirmed(): Promise<void> {
  const { waitlistCount } = await api.getEvent(EVENT_ID);
  const confirmed = await confirmDialog.open({
    title: 'Are you sure you want to remove all users from the Confirmed list?',
    message: waitlistCount > 0 ? 'People on the waitlist will move into the open seats, in waitlist order.' : undefined,
    confirmLabel: 'Remove all',
  });
  if (!confirmed) return;

  try {
    const { removedCount, promoted } = await api.clearConfirmed(EVENT_ID);
    const promotedNote = promoted.length > 0 ? ` ${pluralize(promoted.length, 'person', 'people')} moved from the waitlist into seats.` : '';
    showStatus(`Removed ${pluralize(removedCount, 'person', 'people')} from the Confirmed list.${promotedNote}`);
  } catch (error) {
    showStatus(error instanceof ApiError ? error.message : 'Could not reach the server.', 'error');
  }
  await refresh().catch(() => undefined);
}

async function resetUi(): Promise<void> {
  const confirmed = await confirmDialog.open({
    title: 'Reset to the original testing data?',
    message: "This puts the Confirmed list and the waitlist back to the original 21 people. Anyone you've added or removed will be lost.",
    confirmLabel: 'Reset',
  });
  if (!confirmed) return;

  try {
    await api.resetDemo();
    form.reset();
    showStatus('Reset to the original testing data: 21 of 25 seats filled, nobody waitlisted.');
  } catch (error) {
    showStatus(error instanceof ApiError ? error.message : 'Could not reach the server.', 'error');
  }
  await refresh().catch(() => undefined);
}

requireElement<HTMLButtonElement>('#reset-ui').addEventListener('click', resetUi);

/** About this project: a plain pop-up; Close, Escape or the browser's own handling closes it. */
const aboutDialog = requireElement<HTMLDialogElement>('#about-dialog');
requireElement<HTMLButtonElement>('#about-project').addEventListener('click', () => aboutDialog.showModal());
requireElement<HTMLButtonElement>('#about-close').addEventListener('click', () => aboutDialog.close());

async function logOut(): Promise<void> {
  await api.logOut().catch(() => undefined);
  window.location.assign(LOGIN_PAGE);
}

requireElement<HTMLButtonElement>('#log-out').addEventListener('click', logOut);

async function clearWaitlist(): Promise<void> {
  try {
    const { removedCount } = await api.clearWaitlist(EVENT_ID);
    showStatus(`Removed ${pluralize(removedCount, 'person', 'people')} from the waitlist.`);
  } catch (error) {
    showStatus(error instanceof ApiError ? error.message : 'Could not reach the server.', 'error');
  }
  await refresh().catch(() => undefined);
}

/** Nobody logged in: go to the login page. Otherwise show who is signed in and load the event. */
async function start(): Promise<void> {
  let username: string;
  try {
    ({ username } = await api.me());
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      window.location.assign(LOGIN_PAGE);
      return;
    }
    throw error;
  }
  requireElement<HTMLElement>('#signed-in-as').textContent = `Signed in as ${username}`;
  await refresh();
}

start().catch(() => showStatus('Could not load the event. Is the server running?', 'error'));
