export const formatEstimatedCount = (value: number) => {
  const sizes = ['', 'K', 'M', 'B', 'T']
  if (value === 0) return '0'

  const k = 1000
  const i = Math.floor(Math.log(value) / Math.log(k))

  const unit = i > 4 ? 'T' : sizes[i]

  const formattedValue = value / Math.pow(k, i > 4 ? 4 : i)

  return unit === '' ? `${formattedValue}` : `${formattedValue.toFixed(1)}${unit}`
}
