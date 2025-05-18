export const normalizeString = (str: string) =>
  str
    .normalize('NFD') // Normalize to separate accents
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase() // Convert to lowercase
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
    .replace(/^-+|-+$/g, '') // Trim hyphens from start and end

export const formatDateTime = (isoString: string, timezone: string) => {
  const date = new Date(isoString)

  // Extract the day and the short month
  const dayFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric' })
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' })

  const day = dayFormatter.format(date)
  const month = monthFormatter.format(date)

  // Format the time with AM/PM
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: true,
    // we're saving absolute time
    // timeZone: timezone,
  })

  const time = timeFormatter.format(date)

  // Add timezone abbreviation (PT, ET, etc.)
  // const tzFormatter = new Intl.DateTimeFormat('en-US', {
  //   timeZoneName: 'short',
  //   timeZone: timezone,
  // })
  // const timeZoneAbbreviation = tzFormatter
  //   .formatToParts(date)
  //   .find((part) => part.type === 'timeZoneName')?.value

  // return `${day} ${month} / ${time.replace(':00', '')} ${timeZoneAbbreviation}`
  return `${day} ${month} / ${time.replace(':00', '')}`
}
