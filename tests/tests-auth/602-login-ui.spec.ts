import { EVENT_PAGE_URL, LOGIN_URL, SESSION_COOKIE, WRONG_PASSWORD } from '../constants/constants-auth';
import { AuthMessages, UiMessages } from '../tests-support/expected/Messages';
import { LOGGED_OUT } from '../tests-support/helpers/auth';
import { expect, test } from '../tests-support/helpers/fixtures';
import { DEMO_USER, SEEDED_CONFIRMED, SEEDED_PERSON } from '../tests-support/helpers/testData';

test.describe('Auth UI: logged out', () => {
  test.use({ storageState: LOGGED_OUT });

  test('AUTH-010: Should send a logged-out visitor from the event page to the login page', { tag: ['@P0'] }, async ({ page, loginPage }) => {
    await page.goto(EVENT_PAGE_URL);

    await expect(page).toHaveURL(LOGIN_URL);
    await expect(loginPage.heading).toBeVisible();
  });

  test('AUTH-011: Should log in with the demo account and open the event page', { tag: ['@P0'] }, async ({ page, loginPage, eventPage }) => {
    await loginPage.goto();
    await expect(loginPage.demoHint).toHaveText(AuthMessages.demoHint(DEMO_USER.username, DEMO_USER.password));

    await loginPage.logIn(DEMO_USER);

    await expect(page).toHaveURL(EVENT_PAGE_URL);
    await expect(eventPage.signedInAs).toHaveText(AuthMessages.signedInAs(DEMO_USER.username));
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED));
  });

  test('AUTH-012: Should show "Username or password is incorrect." and stay on the login page for a wrong password', { tag: ['@P1'] }, async ({ page, loginPage }) => {
    await loginPage.goto();

    await loginPage.logIn(WRONG_PASSWORD);

    await expect(loginPage.formError).toHaveText(AuthMessages.wrongCredentials);
    await expect(page).toHaveURL(LOGIN_URL);
    await expect(loginPage.password).toHaveValue(''); // cleared for another try
    await expect(loginPage.password).toBeFocused();
  });

  test('AUTH-013: Should show "Username is required." and "Password is required." when both fields are empty', { tag: ['@P1'] }, async ({ page, loginPage }) => {
    await loginPage.goto();

    await loginPage.submitButton.click();

    await expect(loginPage.usernameError).toHaveText(AuthMessages.usernameRequired);
    await expect(loginPage.passwordError).toHaveText(AuthMessages.passwordRequired);
    await expect(loginPage.username).toHaveAttribute('aria-invalid', 'true');
    await expect(loginPage.username).toBeFocused();
    await expect(page).toHaveURL(LOGIN_URL);
  });

  test('AUTH-014: Should log out with "Log out" and keep the event page closed afterwards', { tag: ['@P0'] }, async ({ page, loginPage, eventPage }) => {
    // Logs in on its own: logging out the shared test session would log out every other test
    await loginPage.goto();
    await loginPage.logIn(DEMO_USER);
    await expect(eventPage.signedInAs).toHaveText(AuthMessages.signedInAs(DEMO_USER.username));

    await eventPage.logOutButton.click();

    await expect(page).toHaveURL(LOGIN_URL);
    await page.goto(EVENT_PAGE_URL);
    await expect(page).toHaveURL(LOGIN_URL);
  });

  test('AUTH-015: Should send the user to the login page when their session ends while the page is open', { tag: ['@P1'] }, async ({ page, loginPage, eventPage }) => {
    await loginPage.goto();
    await loginPage.logIn(DEMO_USER);
    await expect(eventPage.seatSummary).toHaveText(UiMessages.seatsFilled(SEEDED_CONFIRMED));

    // The session ends elsewhere (e.g. logged out in another tab); this page doesn't know yet
    expect((await page.request.post('/api/auth/logout')).status()).toBe(200);
    await eventPage.confirmed.removeButtonFor(SEEDED_PERSON).click();

    await expect(page).toHaveURL(LOGIN_URL);
  });
});

test.describe('Auth UI: logged in', () => {
  test('AUTH-016: Should keep the session cookie out of reach of page scripts', { tag: ['@P0'] }, async ({ page, eventPage }) => {
    await eventPage.goto();

    const sessionCookie = (await page.context().cookies()).find((cookie) => cookie.name === SESSION_COOKIE);
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(await page.evaluate(() => document.cookie)).not.toContain(`${SESSION_COOKIE}=`); // injected JavaScript couldn't steal it
  });
});
