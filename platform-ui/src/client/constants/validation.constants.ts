/**
    Same rules as the server (src/constants/validation.constants.ts).
    The browser checks first for quick feedback; the server still checks every request.
*/
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Emoji (including flags) aren't allowed in any field. */
export const EMOJI_PATTERN = /[\p{Extended_Pictographic}\p{Regional_Indicator}]/u;

export const MESSAGES = {
  firstNameRequired: 'First name is required.',
  lastNameRequired: 'Last name is required.',
  emailRequired: 'Email is required.',
  emailInvalid: 'Email is not valid.',
  firstNameEmoji: "First name can't contain emoji.",
  lastNameEmoji: "Last name can't contain emoji.",
  emailEmoji: "Email can't contain emoji.",
} as const;
