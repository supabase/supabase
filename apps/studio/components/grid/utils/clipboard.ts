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
