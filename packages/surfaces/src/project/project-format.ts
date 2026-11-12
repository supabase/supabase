export const fullNumber = new Intl.NumberFormat()
export const compactNumber = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
})
