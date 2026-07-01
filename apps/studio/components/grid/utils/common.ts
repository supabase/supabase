export function formatClipboardValue(value: unknown) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}
