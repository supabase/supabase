import { CalendarView } from '@/components/calendar/calendar-view'
import { getCalendarActivities } from '@/lib/queries'

export default async function CalendarPage() {
  const activities = await getCalendarActivities()

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-medium text-foreground">Calendar</h1>
      <CalendarView activities={activities} />
    </div>
  )
}
