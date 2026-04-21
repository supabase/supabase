export function sanitizeUrlHashParams(url: string): string {
  return url.split('#')[0]
}

/**
 * Best-effort sanitizer for arrays of objects.
 * - Redacts likely secrets by key name (password, token, apiKey, etc.)
 * - Redacts likely secrets by value pattern (IPv4/IPv6, AWS keys, Bearer/JWT, generic long tokens)
 * - Recurses into nested arrays/objects up to `maxDepth`; beyond that replaces with a notice
 * - Handles circular references
 *
 * @param {any[]} inputArr - Array of items to sanitize (non-objects are copied as-is).
 * @param {Object} [opts]
 * @param {number} [opts.maxDepth=3] - Maximum depth to traverse (0 == only top level).
 * @param {string} [opts.redaction="[REDACTED]"] - Replacement text for sensitive values.
 * @param {string} [opts.truncationNotice="[REDACTED: max depth reached]"] - Used when depth limit is hit.
 * @param {string[]} [opts.sensitiveKeys] - Extra key names to treat as sensitive (case-insensitive).
 * @returns {any[]} a deeply-sanitized clone of the input array
 */
export function sanitizeArrayOfObjects(
  inputArr: unknown[],
  opts: {
    maxDepth?: number
    redaction?: string
    truncationNotice?: string
    sensitiveKeys?: string[]
  } = {}
): unknown[] {
  const {
    maxDepth = 3,
    redaction = '[REDACTED]',
    truncationNotice = '[REDACTED: max depth reached]',
    sensitiveKeys = [],
  } = opts

  // Common sensitive key names (case-insensitive). Extendable via opts.sensitiveKeys.
  const sensitiveKeySet = new Set(
    [
      'password',
      'passwd',
      'pwd',
      'pass',
      'secret',
      'token',
      'id_token',
      'access_token',
      'refresh_token',
      'apikey',
      'api_key',
      'api-key',
      'apiKey',
      'key',
      'privatekey',
      'private_key',
      'client_secret',
      'clientSecret',
      'auth',
      'authorization',
      'ssh_key',
      'sshKey',
      'bearer',
      'session',
      'cookie',
      'csrf',
      'xsrf',
      'ip',
      'ip_address',
      'ipAddress',
      'aws_access_key_id',
      'aws_secret_access_key',
      'gcp_service_account_key',
      ...sensitiveKeys,
    ].map((k) => k.toLowerCase())
  )

  // Value patterns that often indicate secrets or PII
  const patterns = [
    // IPv4
    { re: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g, reason: 'ip' },
    // IPv6 (simplified but effective)
    { re: /\b(?:[A-Fa-f0-9]{1,4}:){2,7}[A-Fa-f0-9]{1,4}\b/g, reason: 'ip6' },
    // AWS Access Key ID (starts with AKIA/ASIA, 16 remaining upper alnum)
    { re: /\b(AKI|ASI)A[0-9A-Z]{16}\b/g, reason: 'aws_access_key_id' },
    // AWS Secret Access Key (40 base64-ish chars)
    { re: /\b[0-9A-Za-z/+]{40}\b/g, reason: 'aws_secret_access_key_like' },
    // Bearer tokens
    { re: /\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/g, reason: 'bearer' },
    // JWT (three base64url segments separated by dots)
    { re: /\b[A-Za-z0-9-_]+?\.[A-Za-z0-9-_]+?\.[A-Za-z0-9-_]+?\b/g, reason: 'jwt_like' },
    // Generic long API-ish token (conservative: 24–64 safe chars)
    { re: /\b[A-Za-z0-9_\-]{24,64}\b/g, reason: 'long_token' },
  ]

  const seen = new WeakMap()

  function isPlainObject(v: unknown): v is Record<string, unknown> {
    if (v === null || typeof v !== 'object') return false
    const proto = Object.getPrototypeOf(v)
    return proto === Object.prototype || proto === null
  }

  function redactString(str: string) {
    let out = str
    for (const { re } of patterns) out = out.replace(re, redaction)
    return out
  }

  function shouldRedactByKey(key: string | symbol | number) {
    return sensitiveKeySet.has(String(key).toLowerCase())
  }

  function sanitizeValue(value: unknown, depth: number): unknown {
    if (
      value == null ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return value
    }

    if (typeof value === 'string') {
      return redactString(value)
    }

    if (typeof value === 'function') {
      return '[Function]'
    }

    if (value instanceof Date) {
      return value.toISOString()
    }

    if (value instanceof RegExp) {
      return value.toString()
    }

    if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
      return `[TypedArray byteLength=${value.byteLength}]`
    }
    if (value instanceof ArrayBuffer) {
      return `[ArrayBuffer byteLength=${value.byteLength}]`
    }

    if (depth >= maxDepth) {
      return truncationNotice
    }

    if (typeof value === 'object') {
      if (seen.has(value)) {
        return '[Circular]'
      }

      if (Array.isArray(value)) {
        const outArr: unknown[] = []
        seen.set(value, outArr)
        for (let i = 0; i < value.length; i++) {
          outArr[i] = sanitizeValue(value[i], depth + 1)
        }
        return outArr
      }

      if (isPlainObject(value)) {
        const outObj: Record<string | symbol | number, unknown> = {}
        seen.set(value, outObj)
        for (const [k, v] of Object.entries(value)) {
          if (shouldRedactByKey(k)) {
            outObj[k] = redaction
          } else {
            outObj[k] = sanitizeValue(v, depth + 1)
          }
        }
        return outObj
      }

      if (value instanceof Map) {
        const out: unknown[] = []
        seen.set(value, out)
        for (const [k, v] of value.entries()) {
          const redactedKey = shouldRedactByKey(k) ? redaction : sanitizeValue(k, depth + 1)
          const redactedVal = shouldRedactByKey(k) ? redaction : sanitizeValue(v, depth + 1)
          out.push([redactedKey, redactedVal])
        }
        return out
      }

      if (value instanceof Set) {
        const out: unknown[] = []
        seen.set(value, out)
        for (const v of value.values()) {
          out.push(sanitizeValue(v, depth + 1))
        }
        return out
      }

      if (value instanceof URL) return value.toString()
      if (value instanceof Error) {
        const o = {
          name: value.name,
          message: redactString(value.message),
          stack: truncationNotice,
        }
        seen.set(value, o)
        return o
      }

      try {
        return redactString(String(value))
      } catch {
        return redactString(Object.prototype.toString.call(value))
      }
    }

    return redactString(String(value))
  }

  return inputArr.map((item) => sanitizeValue(item, 0))
}
