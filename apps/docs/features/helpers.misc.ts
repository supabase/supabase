export function isObject(value: unknown): value is object {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  const prototype = Object.getPrototypeOf(value)
  return prototype === null || prototype === Object.prototype
}

/**
 * Creates a short random identifier
 */
export function nanoId(
  /**
   * The length of the identifier to generate
   */
  length?: number
) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const l = length || 12
  let id = ''
  for (let i = 0; i < l; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}
