import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { EdgeFunctions } from 'icons'
import { Layers, Table } from 'lucide-react'
import { Card, CardContent, CardFooter, cn } from 'ui'

type StripeSyncChangesCardProps = {
  className?: string
  canInstall?: boolean
  onInstall?: () => void
}

export const StripeSyncChangesCard = ({
  className,
  canInstall = true,
  onInstall,
}: StripeSyncChangesCardProps) => {
  const showInstallButton = typeof onInstall === 'function'

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
        {showInstallButton && (
          <CardFooter className="flex justify-end">
            <ButtonTooltip
              type="primary"
              onClick={onInstall}
              disabled={!canInstall}
              tooltip={{
                content: {
                  text: !canInstall
                    ? 'Your database already uses a schema named "stripe"'
                    : undefined,
                },
              }}
            >
              Install integration
            </ButtonTooltip>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
