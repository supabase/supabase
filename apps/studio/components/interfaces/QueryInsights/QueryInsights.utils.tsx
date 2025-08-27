export const formatNumberWithCommas = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '0'
  const numberValue = typeof num === 'string' ? parseFloat(num) : num

  if (isNaN(numberValue)) return '0'

  return numberValue.toLocaleString('en-US')
}
