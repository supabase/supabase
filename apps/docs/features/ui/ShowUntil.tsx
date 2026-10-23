import { type ReactNode } from 'react'

export function ShowUntil({ children, date }: { children: ReactNode; date: string }) {
  const currentDate = new Date()
  const untilDate = new Date(date)

  if (isNaN(untilDate.getTime()) || currentDate < untilDate) {
    return <>{children}</>
  } else {
    console.error(
      `[docs/features/ui/ShowUntil]: Component for ${date} expired, please update remove this note.`
    )
    return null
  }
}
