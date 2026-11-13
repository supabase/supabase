/**
 * Converts literal `\n` escape sequences in a stored multiline value to real
 * newlines, so a textarea displays them correctly.
 *
 * Multiline auth config values (e.g. the SMS template) can be stored with
 * literal `\n` sequences — for example when they were saved from a single-line
 * input, or by the auth service. Without this conversion the textarea shows
 * the literal text `\n` instead of a line break, and the resulting SMS
 * contains `\n` as text rather than a newline, which breaks the WebOTP API
 * format (it requires at least one newline in the message).
 */
export const unescapeNewlines = (value: string): string => value.replace(/\\n/g, '\n')
