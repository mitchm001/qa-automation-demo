import type { APIResponse, PlaywrightWorkerArgs } from '@playwright/test';
import { AUTH_FILE } from './auth';
import { EventsApi } from './EventsApi';
import type { Attendee } from './testData';

/**
    Signs each person up at the same moment, each from their own API client (like separate users).
    Why separate clients: requests sent through one shared client can reuse the same connection and
    reach the server slightly spaced out. In testing, that hid the race condition completely, so a test
    built that way could pass even with the server's locking removed.
*/
export async function signUpAtTheSameTime(
  playwright: PlaywrightWorkerArgs['playwright'],
  baseURL: string | undefined,
  people: Attendee[],
): Promise<Array<{ status: number; signupStatus: string }>> {
  const clients = await Promise.all(people.map(() => playwright.request.newContext({ baseURL, storageState: AUTH_FILE })));
  try {
    const responses: APIResponse[] = await Promise.all(people.map((person, i) => new EventsApi(clients[i]).signUp([person])));
    return await Promise.all(
      responses.map(async (response) => ({ status: response.status(), signupStatus: (await response.json()).signups?.[0]?.status })),
    );
  } finally {
    await Promise.all(clients.map((client) => client.dispose()));
  }
}
