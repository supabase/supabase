import { EdgeFunctions } from 'icons'
import { Layers, Table } from 'lucide-react'
import { Card, CardContent, cn } from 'ui'

type StripeSyncChangesCardProps = {
  className?: string
}

const ListItemClassName = 'flex items-center gap-x-3 py-2 px-3 border-b'

export const StripeSyncChangesCard = ({ className }: StripeSyncChangesCardProps) => {
  return (
    <div className="flex flex-col gap-y-4">
      <h4>This integration will modify your Supabase project:</h4>
      <Card className={cn(className)}>
        <CardContent className="p-0">
          <ul className="text-foreground-light text-sm">
            <li className={ListItemClassName}>
              <Table size={16} strokeWidth={1.5} className="text-foreground-muted shrink-0" />
              <span>
                Creates a new database schema named <code className="text-code-inline">stripe</code>
              </span>
            </li>
            <li className={ListItemClassName}>
              <Table size={16} strokeWidth={1.5} className="text-foreground-muted shrink-0" />
              <span>
                Creates tables and views in the <code className="text-code-inline">stripe</code>{' '}
                schema for synced Stripe data
              </span>
            </li>
            <li className={ListItemClassName}>
              <EdgeFunctions
                size={16}
                strokeWidth={1.5}
                className="text-foreground-muted shrink-0"
              />
              <span>Deploys Edge Functions to handle incoming webhooks from Stripe</span>
            </li>
            <li className="flex items-center gap-x-3 py-2 px-3">
              <Layers size={16} strokeWidth={1.5} className="text-foreground-muted shrink-0" />
              <span>Schedules automatic Stripe data syncs using Supabase Queues</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
