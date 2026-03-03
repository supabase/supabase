import { EdgeFunctions } from 'icons'
import { Layers, Table } from 'lucide-react'
import { SchemaInstallationStatus } from 'stripe-experiment-sync/supabase'
import { Card, CardContent, cn } from 'ui'

import {
  hasInstallError,
  hasUninstallError,
  isInstallDone,
  isInstalled,
  isInstalling,
  isUninstallDone,
  isUninstalling,
} from './stripe-sync-status'

type StripeSyncChangesCardProps = {
  installationStatus: SchemaInstallationStatus
  className?: string
  isUpgrade?: boolean
}

const ListItemClassName = 'flex items-center gap-x-3 py-2 px-3 border-b'

export const StripeSyncChangesCard = ({
  installationStatus,
  className,
  isUpgrade,
}: StripeSyncChangesCardProps) => {
  const installed = isInstalled(installationStatus)
  const installError = hasInstallError(installationStatus)
  const uninstallError = hasUninstallError(installationStatus)
  const installInProgress = isInstalling(installationStatus)
  const uninstallInProgress = isUninstalling(installationStatus)
  const installDone = isInstallDone(installationStatus)
  const uninstallDone = isUninstallDone(installationStatus)

  const title =
    uninstallDone || installError
      ? 'This integration will modify your Supabase project:'
      : installInProgress || uninstallInProgress
        ? 'This integration is modifying your Supabase project:'
        : installDone || installed || uninstallError
          ? 'This integration has modified your Supabase project:'
          : ''

  const dbLine =
    uninstallDone || installError
      ? 'Creates a new database schema named '
      : installInProgress
        ? isUpgrade
          ? 'Upgrading database schema named '
          : 'Creating a new database schema named '
        : installDone || installed || uninstallError
          ? 'Created a new database schema named '
          : uninstallInProgress
            ? 'Dropping database schema named '
            : ''

  const tableAndViewLine =
    uninstallDone || installError
      ? 'Creates tables and views in the '
      : installInProgress
        ? isUpgrade
          ? 'Upgrading tables and views in the '
          : 'Creating tables and views in the '
        : installDone || installed || uninstallError
          ? 'Created tables and views in the '
          : uninstallInProgress
            ? 'Dropping tables and views in the '
            : ''

  const edgeFunctionsLine =
    uninstallDone || installError
      ? 'Deploys Edge Functions to handle incoming webhooks from Stripe'
      : installInProgress
        ? isUpgrade
          ? 'Upgrading Edge Functions to handle incoming webhooks from Stripe'
          : 'Deploying Edge Functions to handle incoming webhooks from Stripe'
        : installDone || installed || uninstallError
          ? 'Deployed Edge Functions to handle incoming webhooks from Stripe'
          : uninstallInProgress
            ? 'Undeploying Edge Functions to handle incoming webhooks from Stripe'
            : ''

  const scheduleLine =
    uninstallDone || installError
      ? 'Schedules automatic Stripe data syncs using Supabase Queues'
      : installInProgress
        ? isUpgrade
          ? 'Upgrading automatic Stripe data syncs using Supabase Queues'
          : 'Scheduling automatic Stripe data syncs using Supabase Queues'
        : installDone || installed || uninstallError
          ? 'Scheduled automatic Stripe data syncs using Supabase Queues'
          : uninstallInProgress
            ? 'Unscheduling automatic Stripe data syncs using Supabase Queues'
            : ''

  return (
    <div className="flex flex-col gap-y-4">
      <h4>{title}</h4>
      <Card className={cn(className)}>
        <CardContent className="p-0">
          <ul className="text-foreground-light text-sm">
            <li className={ListItemClassName}>
              <Table size={16} strokeWidth={1.5} className="text-foreground-lighter shrink-0" />
              <span>
                {dbLine} <code className="text-code-inline">stripe</code>
              </span>
            </li>
            <li className={ListItemClassName}>
              <Table size={16} strokeWidth={1.5} className="text-foreground-lighter shrink-0" />
              <span>
                {tableAndViewLine} <code className="text-code-inline">stripe</code> schema for
                synced Stripe data
              </span>
            </li>
            <li className={ListItemClassName}>
              <EdgeFunctions
                size={16}
                strokeWidth={1.5}
                className="text-foreground-lighter shrink-0"
              />
              <span>{edgeFunctionsLine}</span>
            </li>
            <li className="flex items-center gap-x-3 py-2 px-3">
              <Layers size={16} strokeWidth={1.5} className="text-foreground-lighter shrink-0" />
              <span>{scheduleLine}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
