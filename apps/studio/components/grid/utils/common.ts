export function formatClipboardValue(value: unknown) {
  if (!value) return ''
  if (typeof value == 'object' || Array.isArray(value)) {
    return JSON.stringify(value)
  }
  return String(value)
}

export async function writeTextToClipboard(value: string) {
  if (typeof navigator === 'undefined' || navigator.clipboard?.writeText === undefined) {
    return false
  }

  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}
