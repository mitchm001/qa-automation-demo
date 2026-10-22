export const NAME_MAX_LENGTH = 50;

/** The longest email address the email standard (RFC 5321) allows. */
export const EMAIL_MAX_LENGTH = 254;

/** Deliberately simple: something@something.something, with no spaces. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
    Emoji are not allowed in any field. Extended_Pictographic covers emoji (including skin tones and
    combined emoji like families); Regional_Indicator covers flag emoji. Letters from any language are fine.
*/
export const EMOJI_PATTERN = /[\p{Extended_Pictographic}\p{Regional_Indicator}]/u;
