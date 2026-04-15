export const SMS_TEMPLATE_KEY = 'SMS_TEMPLATE'

/**
 * Converts literal escaped newlines ("\\n") into real newlines.
 * This keeps backwards compatibility for values previously saved as escaped text.
 */
export const normalizeEscapedNewlines = (value: unknown): unknown => {
  if (typeof value !== 'string') return value
  return value.replace(/\\n/g, '\n')
}

export const normalizeSmsTemplateValue = (key: string, value: unknown): unknown => {
  if (key !== SMS_TEMPLATE_KEY) return value
  return normalizeEscapedNewlines(value)
}

export const normalizeSmsTemplateValueTyped = <T extends string | boolean>(
  key: string,
  value: T
): T => normalizeSmsTemplateValue(key, value) as T
