export function DateFormat({
  date,
  options,
}: {
  date: string
  options?: Intl.DateTimeFormatOptions
}) {
  const dateObject = new Date(date)
  return (
    <time dateTime={dateObject.toISOString()} suppressHydrationWarning>
      {dateObject.toLocaleDateString(undefined, options)}
    </time>
  )
}
