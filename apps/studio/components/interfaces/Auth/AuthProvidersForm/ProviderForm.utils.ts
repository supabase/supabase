/**
 * The SMS OTP template is edited in a multiline textarea but stored by the backend
 * with real newline characters. WebOTP (and similar standards) rely on those real
 * newlines being present in the delivered message, so users type the escape sequence
 * `\n` to indicate where a line break should go.
 *
 * To keep the value consistent across a save/reload round-trip we encode the typed
 * escape sequence into a real newline before sending it to the API, and decode it
 * back into the visible `\n` escape sequence when populating the form. Without the
 * decode step a saved template would reload as a literal multiline string that no
 * longer matches what the user typed.
 *
 * Note: this treats every `\n` the user types as a line break, so a template that
 * genuinely needs the two literal characters `\` followed by `n` is not supported.
 * That trade-off matches the original feature request and keeps the transform
 * reversible.
 */

/** Convert user-typed escaped newlines (`\n`) into real newline characters for the API. */
export const encodeSmsTemplateNewlines = (template: string): string =>
  template.replace(/\\n/g, '\n')

/** Convert stored real newline characters back into `\n` escape sequences for display. */
export const decodeSmsTemplateNewlines = (template: string): string =>
  template.replace(/\n/g, '\\n')
