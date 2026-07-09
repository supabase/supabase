import { Badge, Button, Card, CardContent } from 'ui'

import { completeActivity } from '@/lib/actions'
import { createClient } from '@/lib/supabase/server'

const TYPE_LABELS: Record<string, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
  follow_up: 'Follow-up',
}

export default async function ActivitiesPage() {
  const supabase = await createClient()
  const { data: activities } = await supabase
    .from('activities')
    .select('*, leads(name, company)')
    .order('completed_at', { ascending: true, nullsFirst: true })
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-medium text-foreground">Activities</h1>

      {(!activities || activities.length === 0) && (
        <p className="text-sm text-foreground-light">
          No activities yet. Tap + to log a call, email, or follow-up.
        </p>
      )}

      {activities?.map((activity) => (
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
                Due {new Date(activity.due_at).toLocaleString()}
              </span>
            )}
            {activity.notes && <p className="text-xs text-foreground-light">{activity.notes}</p>}
            {!activity.completed_at && (
              <form action={completeActivity.bind(null, activity.id)} className="pt-1">
                <Button type="submit" size="tiny" variant="outline">
                  Mark done
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
