/**
 * Utilities for formatting PostgreSQL view options (reloptions from pg_class).
 *
 * pg_class.reloptions stores values as "key=value" (e.g. "security_invoker=true").
 * PostgreSQL's pg_dump uses the normalized form "key = on/off" with spaces.
 * These helpers normalize to the pg_dump-compatible format for visual consistency.
 */

function parseOption(opt: string): [string, string] {
  const eqIndex = opt.indexOf('=')
  if (eqIndex === -1) return [opt.trim(), '']
  return [opt.slice(0, eqIndex).trim(), opt.slice(eqIndex + 1).trim()]
}

export function normalizeViewOptions(opts: string): string {
  return opts
    .split(',')
    .map((opt) => {
      const [key, value] = parseOption(opt)
      const normalized = value === 'true' ? 'on' : value === 'false' ? 'off' : value
      return `${key} = ${normalized}`
    })
    .join(', ')
}

export function formatViewOptionsClause(opts: string | null | undefined): string {
  if (!opts) return ''
  return ` with (${normalizeViewOptions(opts)})`
}

export function mergeViewOptions(
  existing: string | null | undefined,
  newOption: string
): string {
  if (!existing) return normalizeViewOptions(newOption)

  const [newKey] = parseOption(newOption)
  const parts = existing.split(',').map((s) => s.trim())

  let replaced = false
  const merged = parts.map((part) => {
    const [key] = parseOption(part)
    if (key === newKey) {
      replaced = true
      return newOption
    }
    return part
  })

  if (!replaced) merged.push(newOption)

  return normalizeViewOptions(merged.join(', '))
}
