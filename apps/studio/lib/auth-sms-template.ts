/** Config keys that store user-editable SMS body templates in GoTrue. */
export const SMS_TEMPLATE_CONFIG_KEYS = ['SMS_TEMPLATE', 'MFA_PHONE_TEMPLATE'] as const

/** Auth config property name for an SMS or MFA phone message template. */
export type SmsTemplateConfigKey = (typeof SMS_TEMPLATE_CONFIG_KEYS)[number]

const SMS_TEMPLATE_CONFIG_KEY_SET = new Set<string>(SMS_TEMPLATE_CONFIG_KEYS)

/**
 * @param key - Auth config field name from a form or API payload.
 * @returns Whether the key stores an SMS/MFA phone message template.
 */
export function isSmsTemplateConfigKey(key: string): key is SmsTemplateConfigKey {
  return SMS_TEMPLATE_CONFIG_KEY_SET.has(key)
}

/**
 * Converts literal `\\n` and `\\r\\n` sequences in SMS templates to real line breaks.
 *
 * Older Studio configs stored escaped newlines from single-line inputs. WebOTP
 * expects an actual newline after the OTP line.
 *
 * @param template - Raw template from auth config or form state.
 * @returns The template with escaped line breaks replaced, or an empty string for nullish input.
 */
export function normalizeSmsTemplateNewlines(template: string | null | undefined): string {
  if (template == null || template === '') {
    return template ?? ''
  }

  return template.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')
}

/**
 * Reads an SMS template from auth config, applying newline normalization and an optional fallback.
 *
 * @param template - Raw template from auth config.
 * @param fallback - Value used when `template` is nullish.
 * @returns Normalized template text for form display.
 */
export function readSmsTemplateFromConfig(
  template: string | null | undefined,
  fallback = ''
): string {
  return normalizeSmsTemplateNewlines(template ?? fallback)
}

/**
 * Normalizes SMS template fields in an auth config payload before persisting.
 *
 * @param payload - Auth config object being saved to the API.
 * @returns A shallow copy of the payload with SMS template fields normalized.
 */
export function normalizeSmsTemplateFieldsInPayload<T extends Record<string, unknown>>(
  payload: T
): T {
  const normalized: Record<string, unknown> = { ...payload }

  for (const key of SMS_TEMPLATE_CONFIG_KEYS) {
    const value = normalized[key]
    if (typeof value === 'string') {
      normalized[key] = normalizeSmsTemplateNewlines(value)
    }
  }

  return normalized as T
}
