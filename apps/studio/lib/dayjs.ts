import dayjs from 'dayjs'

export function guessLocalTimezone(): string {
  const guess = dayjs.tz.guess()
  try {
    Intl.DateTimeFormat(undefined, { timeZone: guess })
    return guess
  } catch {
    return 'UTC'
  }
}
