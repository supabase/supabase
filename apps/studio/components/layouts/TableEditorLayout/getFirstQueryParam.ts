export function getFirstQueryParam(value: string | string[] | undefined): string | undefined {
  const firstValue = Array.isArray(value) ? value[0] : value

  if (typeof firstValue !== 'string' || firstValue.length === 0) {
    return undefined
  }

  return firstValue
}
