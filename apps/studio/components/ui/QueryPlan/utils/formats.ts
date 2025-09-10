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
