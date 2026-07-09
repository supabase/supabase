'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardContent } from 'ui'

import { completeActivity } from '@/lib/actions'
import { addDays, dateKey, isSameDay, startOfDay, startOfWeek } from '@/lib/dates'
import type { getCalendarActivities } from '@/lib/queries'

type CalendarActivity = Awaited<ReturnType<typeof getCalendarActivities>>[number]

const TYPE_LABELS: Record<string, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
  follow_up: 'Follow-up',
}

export function CalendarView({ activities }: { activities: CalendarActivity[] }) {
  const today = useMemo(() => startOfDay(new Date()), [])
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today))
  const [selectedDate, setSelectedDate] = useState(today)

  const activitiesByDay = useMemo(() => {
    const map = new Map<string, CalendarActivity[]>()
    for (const activity of activities) {
      if (!activity.due_at) continue
      const key = dateKey(new Date(activity.due_at))
      const bucket = map.get(key) ?? []
      bucket.push(activity)
      map.set(key, bucket)
    }
    return map
  }, [activities])

  const visibleDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  const selectedDayActivities = activitiesByDay.get(dateKey(selectedDate)) ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="text"
          size="tiny"
          icon={<ChevronLeft size={16} />}
          aria-label="Previous week"
          onClick={() => setWeekStart((prev) => addDays(prev, -7))}
        />
        <Button
          type="button"
          variant="text"
          size="tiny"
          onClick={() => {
            setWeekStart(startOfWeek(today))
            setSelectedDate(today)
          }}
        >
          Today
        </Button>
        <Button
          type="button"
          variant="text"
          size="tiny"
          icon={<ChevronRight size={16} />}
          aria-label="Next week"
          onClick={() => setWeekStart((prev) => addDays(prev, 7))}
        />
      </div>

      <div className="grid grid-cols-7 gap-1">
        {visibleDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate)
          const hasItems = (activitiesByDay.get(dateKey(day))?.length ?? 0) > 0
          return (
            <button
              key={dateKey(day)}
              type="button"
              onClick={() => setSelectedDate(day)}
              className={`flex flex-col items-center gap-1 rounded-md py-2 text-xs ${
                isSelected ? 'bg-surface-200 text-foreground' : 'text-foreground-light'
              }`}
            >
              <span>{day.toLocaleDateString('en-US', { weekday: 'short' })[0]}</span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  isSameDay(day, today) ? 'bg-brand-600 text-background' : ''
                }`}
              >
                {day.getDate()}
              </span>
              <span className={`h-1 w-1 rounded-full ${hasItems ? 'bg-brand-600' : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>

        {selectedDayActivities.length === 0 && (
          <p className="text-sm text-foreground-light">Nothing scheduled.</p>
        )}

        {selectedDayActivities.map((activity) => (
          <Card key={activity.id}>
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-medium ${
                      activity.completed_at ? 'text-foreground-muted line-through' : 'text-foreground'
                    }`}
                  >
                    {activity.subject}
                  </span>
                  {activity.leads && (
                    <span className="text-xs text-foreground-light">
                      {activity.leads.name}
                      {activity.leads.company ? ` · ${activity.leads.company}` : ''}
                    </span>
                  )}
                </div>
                <Badge variant="secondary">{TYPE_LABELS[activity.type] ?? activity.type}</Badge>
              </div>
              {activity.due_at && (
                <span className="text-xs text-foreground-light">
                  {new Date(activity.due_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              )}
              {!activity.completed_at && (
                <form action={completeActivity.bind(null, activity.id)}>
                  <Button type="submit" size="tiny" variant="outline">
                    Mark done
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
