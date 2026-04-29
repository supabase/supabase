export function formatClipboardValue(value: unknown) {
  if (!value) return ''
  if (typeof value == 'object' || Array.isArray(value)) {
    return JSON.stringify(value)
  }
  return String(value)
}
