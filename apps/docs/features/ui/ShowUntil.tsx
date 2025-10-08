import { type ReactNode } from 'react'

export function ShowUntil({ children, date }: { children: ReactNode; date: string }) {
  const currentDate = new Date()
  const untilDate = new Date(date)

  if (isNaN(untilDate.getTime()) || currentDate < untilDate) {
    return <>{children}</>
  } else {
    return null
  }
}
