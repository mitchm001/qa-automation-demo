import { EVENT_CAPACITY } from './event.constants.js';

export const SEED_EVENT = {
  name: 'QA Automation Meetup',
  capacity: EVENT_CAPACITY,
};

/**
    The people already signed up when the app starts (emails use example.com, a domain reserved for examples).
    Some have international names (accents, Japanese characters, hyphens) to show the app saves and shows them correctly.
    Emails are made from each name automatically; a name with no A–Z letters (行弘 松本) has its email written out instead.
*/
export const SEED_ATTENDEE_NAMES: ReadonlyArray<[firstName: string, lastName: string, email?: string]> = [
  ['Ada', 'Lovelace'],
  ['Alan', 'Turing'],
  ['Grace', 'Hopper'],
  ['Katherine', 'Johnson'],
  ['Linus', 'Torvalds'],
  ['Margaret', 'Hamilton'],
  ['Tim', 'Berners-Lee'],
  ['Barbara', 'Liskov'],
  ['Dennis', 'Ritchie'],
  ['Frances', 'Allen'],
  ['Fernando', 'Corbató'],
  ['Radia', 'Perlman'],
  ['行弘', '松本', 'yukihiro.matsumoto@example.com'],
  ['Hedy', 'Lamarr'],
  ['Edsger', 'Dijkstra'],
  ['Annie', 'Easley'],
  ['Muhammad', 'al-Khwārizmī'],
  ['Ole-Johan', 'Dahl'],
  ['Guido', 'van Rossum'],
  ['Shafi', 'Goldwasser'],
  ['Bjarne', 'Stroustrup'],
];
