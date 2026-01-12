export function formatClipboardValue(value: any) {
  if (!value) return ''
  if (typeof value == 'object' || Array.isArray(value)) {
    return JSON.stringify(value)
  }
  return value
}
