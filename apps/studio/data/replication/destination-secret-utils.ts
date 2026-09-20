const MASKED_SECRET_PLACEHOLDER_PATTERN = /^•+$/

export const optionalSecret = (value: string | undefined) => {
  const trimmed = value?.trim()

  if (!trimmed || MASKED_SECRET_PLACEHOLDER_PATTERN.test(trimmed)) {
    return undefined
  }

  return value
}
