export const stripParens = (s: string) => s.replace(/^\((.*)\)$/, '$1')

// Buffers tooltips helpers
export const blocksToBytes = (blocks?: number) => {
  const b = (blocks ?? 0) * 8192 // 8kB per block
  if (!b) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = b
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }

  return `${v.toFixed(1)} ${units[i]}`
}

// Normalize keys that can be string or string[] in JSON
export const toArray = (v?: string[] | string): string[] | undefined => {
  if (v === undefined) return undefined

  return Array.isArray(v) ? v : [v]
}

// Group/Sort/Presorted keys
export const formatKeys = (keys: string[] | undefined, presorted?: string[]) => {
  if (!keys || keys.length === 0) return undefined

  const pres = new Set((presorted ?? []).map((k) => stripParens(k)))

  return keys
    .map((k) => {
      const kk = stripParens(k)
      return pres.has(kk) ? `${kk} (presort)` : kk
    })
    .join(', ')
}
