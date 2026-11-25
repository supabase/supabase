// Page dates are UTC calendar days (frontmatter `date: 2026-09-24`), so both
// helpers format in UTC and don't shift with the build machine's timezone.

/** "Sep 24, 2026" */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/** "2026-09-24", the form schema.org `dateModified` expects. */
export function toIsoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}
