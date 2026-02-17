import { EdgeFunctions } from 'icons'
import { Layers, Table } from 'lucide-react'
import { Card, CardContent, cn } from 'ui'

type StripeSyncChangesCardProps = {
  className?: string
}

export const StripeSyncChangesCard = ({ className }: StripeSyncChangesCardProps) => {
  return (
    <div>
      <h3 className="heading-default mb-4">This integration will modify your Supabase project:</h3>
      <Card className={cn(className)}>
        <CardContent className="p-0">
          <ul className="text-foreground-light text-sm">
            <li className="flex items-center gap-3 py-2 px-3 border-b">
              <Table size={16} strokeWidth={1.5} className="text-foreground-muted shrink-0" />
              <span>
                Creates a new database schema named <code>stripe</code>
              </span>
            </li>
            <li className="flex items-center gap-3 py-2 px-3 border-b">
              <Table size={16} strokeWidth={1.5} className="text-foreground-muted shrink-0" />
              <span>
                Creates tables and views in the <code>stripe</code> schema for synced Stripe data
              </span>
            </li>
            <li className="flex items-center gap-3 py-2 px-3 border-b">
              <EdgeFunctions
                size={16}
                strokeWidth={1.5}
                className="text-foreground-muted shrink-0"
              />
              <span>Deploys Edge Functions to handle incoming webhooks from Stripe</span>
            </li>
            <li className="flex items-center gap-3 py-2 px-3">
              <Layers size={16} strokeWidth={1.5} className="text-foreground-muted shrink-0" />
              <span>Schedules automatic Stripe data syncs using Supabase Queues</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
