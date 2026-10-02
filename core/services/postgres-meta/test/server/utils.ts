import { build as buildApp } from '../../src/server/app'

export const app = buildApp()

/**
 * Normalizes UUIDs in test data to make snapshots resilient to UUID changes.
 * Replaces all UUID strings with a consistent placeholder.
 */
export function normalizeUuids(data: unknown): unknown {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (typeof data === 'string' && uuidRegex.test(data)) {
    return '00000000-0000-0000-0000-000000000000'
  }

  if (Array.isArray(data)) {
    return data.map(normalizeUuids)
  }

  if (data !== null && typeof data === 'object') {
    const normalized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      normalized[key] = normalizeUuids(value)
    }
    return normalized
  }

  return data
}
