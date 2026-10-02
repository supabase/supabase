export const MAX_HEADER_NAME_LENGTH = 1024 * 8 // 8KB
export const MAX_HEADER_VALUE_LENGTH = 1024 * 8 // 8KB

/**
 * Checks whether a character code is valid in an HTTP token per RFC 7230.
 * Header names are tokens: alphanumeric plus !#$%&'*+-.^_`|~.
 * @see https://tools.ietf.org/html/rfc7230#section-3.2.6
 */
const isHttpTokenCharCode = (c: number): boolean =>
  (c >= 0x30 && c <= 0x39) ||
  (c >= 0x41 && c <= 0x5a) ||
  (c >= 0x61 && c <= 0x7a) ||
  c === 0x21 ||
  (c >= 0x23 && c <= 0x27) ||
  c === 0x2a ||
  c === 0x2b ||
  c === 0x2d ||
  c === 0x2e ||
  c === 0x5e ||
  c === 0x5f ||
  c === 0x60 ||
  c === 0x7c ||
  c === 0x7e

/**
 * Checks if a string contains invalid HTTP header characters per RFC 7230.
 * Valid: TAB (0x09), visible ASCII (0x20-0x7E), obs-text (0x80-0xFF).
 * Invalid: control characters (0x00-0x1F except TAB), DEL (0x7F), and >0xFF.
 * Uses charCodeAt for lower overhead than regex on short header values.
 * @see https://tools.ietf.org/html/rfc7230#section-3.2
 */
const isInvalidHeaderValueCharCode = (c: number): boolean =>
  c > 0xff || (c < 0x20 && c !== 0x09) || c === 0x7f

export function hasInvalidHeaderValueChars(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    if (isInvalidHeaderValueCharCode(value.charCodeAt(i))) {
      return true
    }
  }
  return false
}

export function isValidHeaderName(name: string): boolean {
  if (name.length === 0 || name.length > MAX_HEADER_NAME_LENGTH) {
    return false
  }

  for (let i = 0; i < name.length; i++) {
    if (!isHttpTokenCharCode(name.charCodeAt(i))) {
      return false
    }
  }

  return true
}

export function isValidHeaderValue(value: string): boolean {
  let byteLength = 0

  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i)
    if (isInvalidHeaderValueCharCode(c)) {
      return false
    }

    byteLength += c < 0x80 ? 1 : 2
    if (byteLength > MAX_HEADER_VALUE_LENGTH) {
      return false
    }
  }

  return true
}

export function isValidHeader(name: string, value: string | string[]): boolean {
  if (!isValidHeaderName(name)) {
    return false
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (!isValidHeaderValue(value[i])) {
        return false
      }
    }
    return true
  }

  return isValidHeaderValue(value)
}
