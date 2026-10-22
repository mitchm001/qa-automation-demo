import { CAPACITY, EMAIL_MAX_LENGTH, fullName, MAX_PEOPLE_PER_SIGNUP, NAME_MAX_LENGTH, type Attendee, type AttendeeField } from '../helpers/testData';

export const FIELD_LABELS: Record<AttendeeField, string> = { firstName: 'First name', lastName: 'Last name', email: 'Email' };

function people(count: number): string {
  return `${count} ${count === 1 ? 'person' : 'people'}`;
}

/** Error text for a single field, shown by the API (fieldErrors) and under the inputs on the page. */
export class FieldMessages {
  static required(field: AttendeeField): string {
    return `${FIELD_LABELS[field]} is required.`;
  }

  static tooLong(field: AttendeeField): string {
    const max = field === 'email' ? EMAIL_MAX_LENGTH : NAME_MAX_LENGTH;
    return `${FIELD_LABELS[field]} must be ${max} characters or fewer.`;
  }

  static noEmoji(field: AttendeeField): string {
    return `${FIELD_LABELS[field]} can't contain emoji.`;
  }

  static readonly emailInvalid = 'Email is not valid.';
  static readonly attendeesNotList = 'attendees must be a list of people.';
  static readonly peopleCount = `Add between 1 and ${MAX_PEOPLE_PER_SIGNUP} people per sign-up.`;
  static readonly personNotObject = 'Each person must be an object with firstName, lastName and email.';

  /** personNumber is 1-based, as people are numbered on screen. */
  static repeatedInRequest(personNumber: number): string {
    return `This email is already used by person ${personNumber} in this list.`;
  }

  static alreadySignedUp(email: string): string {
    return `${email} is already signed up for this event.`;
  }

  /** Shown under the form when the server reports a duplicate (same text as the API's 409 message). */
  static readonly duplicateSummary = 'One or more people are already signed up for this event.';
}

/** Text the page shows: the status banner, headings, counters and pop-ups. */
export class UiMessages {
  /** e.g. "Signed up 5 people: 4 confirmed, 1 waitlisted." */
  static signedUp(confirmed: number, waitlisted: number): string {
    return `Signed up ${people(confirmed + waitlisted)}: ${confirmed} confirmed, ${waitlisted} waitlisted.`;
  }

  static removed(person: Pick<Attendee, 'firstName' | 'lastName'>): string {
    return `Removed ${fullName(person)}.`;
  }

  static removedAndMovedUp(removed: Pick<Attendee, 'firstName' | 'lastName'>, movedUp: Pick<Attendee, 'firstName' | 'lastName'>): string {
    return `Removed ${fullName(removed)}. ${fullName(movedUp)} moved from the waitlist into the open seat.`;
  }

  static clearedWaitlist(count: number): string {
    return `Removed ${people(count)} from the waitlist.`;
  }

  static removedAllConfirmed(count: number, movedUp = 0): string {
    const note = movedUp > 0 ? ` ${people(movedUp)} moved from the waitlist into seats.` : '';
    return `Removed ${people(count)} from the Confirmed list.${note}`;
  }

  static seatsFilled(confirmed: number): string {
    return `${confirmed} of ${CAPACITY} seats filled`;
  }

  static confirmedHeading(count: number): string {
    return `Confirmed (${count})`;
  }

  static waitlistHeading(count: number): string {
    return `Waitlist (${count})`;
  }

  static readonly waitlistEmpty = 'Nobody is on the waitlist.';
  static readonly serverUnreachable = 'Could not reach the server. Please try again.';
  static readonly eventLoadFailed = 'Could not load the event. Is the server running?';
  static readonly eventLoading = 'Loading event…';

  /* Seat picker pop-up */
  static seatsLeftTitle(seats: number): string {
    return `Only ${seats} seat${seats === 1 ? '' : 's'} left`;
  }

  static seatsSelected(selected: number, seats: number): string {
    return `${selected} of ${seats} seats selected`;
  }

  static selectedForWaitlist(selected: number, total: number): string {
    return `${selected} of ${total} selected for the waitlist`;
  }

  static readonly eventFullTitle = 'This event is full';
  static readonly eventFullDescriptionStart = 'There are no open seats.';

  /* Remove all pop-up */
  static readonly removeAllTitle = 'Are you sure you want to remove all users from the Confirmed list?';
  static readonly removeAllWaitlistNote = 'People on the waitlist will move into the open seats, in waitlist order.';

  /* Reset UI */
  static readonly resetTooltip =
    "Resets the Confirmed list and the waitlist to their original testing state: the 21 starting people, nobody waitlisted. Anyone you've added or removed will be lost.";
  static readonly resetTitle = 'Reset to the original testing data?';
  static readonly resetMessage = "This puts the Confirmed list and the waitlist back to the original 21 people. Anyone you've added or removed will be lost.";
  static readonly resetConfirmLabel = 'Reset';
  static readonly resetDone = 'Reset to the original testing data: 21 of 25 seats filled, nobody waitlisted.';
}

/** Text on the login page and the logged-in header. */
export class AuthMessages {
  static readonly usernameRequired = 'Username is required.';
  static readonly passwordRequired = 'Password is required.';
  static readonly wrongCredentials = 'Username or password is incorrect.';

  static signedInAs(username: string): string {
    return `Signed in as ${username}`;
  }

  static demoHint(username: string, password: string): string {
    return `Demo account: ${username} / ${password}`;
  }
}

