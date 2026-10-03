/**
 * Helpers for SMS OTP message templates.
 *
 * Auth templates use Go template syntax with `{{ .Code }}` for the OTP code.
 * The WebOTP API requires the sent SMS to contain at least one newline, so
 * templates must be able to carry newlines through the dashboard to the
 * message that is sent.
 *
 * Choice documented for supabase/supabase#6435: accept both real newlines
 * and `\n` escape sequences. Real newlines are preserved (CRLF and CR are
 * normalized to LF). Literal backslash-n sequences are converted to a real
 * newline when the template is normalized or rendered. Templates without
 * newlines keep their current behavior.
 */

export const SMS_OTP_CODE_PATTERN = /\{\{\s*\.Code\s*\}\}/g

export const SMS_TEMPLATE_NEWLINE_HINT =
  'To format the OTP code use `{{ .Code }}`. Include a newline for WebOTP autofill support: use a real line break or `\\n`.'

/**
 * Normalize an SMS OTP template so newline intent survives to the sent SMS.
 * Preserves real newlines (normalizing CRLF/CR to LF) and converts literal
 * `\r\n`, `\n`, and `\r` escape sequences to a real newline.
 */
export function normalizeSmsTemplate(template: string): string {
  return template
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
}

/**
 * Render an SMS OTP template with a code, applying the same newline
 * normalization that is applied before saving. Used for preview and tests.
 * The Auth server performs the same `{{ .Code }}` substitution when sending.
 */
export function renderSmsOtpTemplate(template: string, code: string): string {
  return normalizeSmsTemplate(template).replace(SMS_OTP_CODE_PATTERN, code)
}

/**
 * Check whether a rendered SMS body meets the WebOTP requirement of
 * containing at least one newline.
 */
export function isWebOtpCompliantMessage(message: string): boolean {
  return message.includes('\n')
}
