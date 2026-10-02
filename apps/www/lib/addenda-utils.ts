const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function formatAddendumDate(yyyymmdd: string) {
  const year = Number(yyyymmdd.slice(0, 4))
  const month = Number(yyyymmdd.slice(4, 6))
  const day = Number(yyyymmdd.slice(6, 8))
  if (month < 1 || month > 12) throw new Error(`Invalid month ${month} in date "${yyyymmdd}"`)
  return `${MONTHS[month - 1]} ${day}, ${year}`
}

/** Parse id, label, and formatted effective date from a filename like "20260615-v1.1.mdx". */
export function parseVersionFile(filename: string): {
  id: string
  label: string
  effectiveDate: string
} {
  const base = filename.replace(/\.mdx$/, '')
  const dashIdx = base.indexOf('-')
  const id = base.slice(dashIdx + 1)
  return {
    id,
    label: 'Version ' + id.replace(/^v/, ''),
    effectiveDate: formatAddendumDate(base.slice(0, dashIdx)),
  }
}
