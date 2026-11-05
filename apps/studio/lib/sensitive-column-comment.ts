export const SENSITIVE_DATA_MARKER = '[SENSITIVE]'

export const isSensitiveComment = (comment: string | null | undefined): boolean => {
  if (!comment) return false
  return comment.startsWith(SENSITIVE_DATA_MARKER) || comment.endsWith(SENSITIVE_DATA_MARKER)
}

export const decodeSensitiveComment = (comment: string | null | undefined): string | null => {
  if (!comment) return null
  let stripped = comment
  if (stripped.startsWith(SENSITIVE_DATA_MARKER)) {
    stripped = stripped.slice(SENSITIVE_DATA_MARKER.length).replace(/^ /, '')
  } else if (stripped.endsWith(SENSITIVE_DATA_MARKER)) {
    stripped = stripped.slice(0, -SENSITIVE_DATA_MARKER.length).replace(/ $/, '')
  }
  return stripped || null
}

export const encodeSensitiveComment = (
  comment: string | null | undefined,
  isSensitive: boolean
): string | null => {
  const base = decodeSensitiveComment(comment) ?? ''
  if (isSensitive && base) return `${SENSITIVE_DATA_MARKER} ${base}`
  if (isSensitive) return SENSITIVE_DATA_MARKER
  return base || null
}
