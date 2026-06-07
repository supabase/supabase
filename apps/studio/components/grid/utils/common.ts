export function formatClipboardValue(value: unknown) {
  if (!value) return ''
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}
