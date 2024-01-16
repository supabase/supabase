import { useParams, useTelemetryProps } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

import AlertError from 'components/ui/AlertError'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import Panel from 'components/ui/Panel'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { useFlag, useSelectedOrganization, useSelectedProject } from 'hooks'
import { pluckObjectFields } from 'lib/helpers'
import Telemetry from 'lib/telemetry'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Badge,
  Button,
  IconAlertTriangle,
  IconExternalLink,
  Input,
  Separator,
} from 'ui'
import ConfirmDisableReadOnlyModeModal from './ConfirmDisableReadOnlyModal'
import ResetDbPassword from './ResetDbPassword'
import { DatabaseConnectionString } from './DatabaseConnectionString'

const DatabaseSettings = () => {
  const router = useRouter()
  const { ref: projectRef, connectionString } = useParams()
  const telemetryProps = useTelemetryProps()
  const state = useDatabaseSelectorStateSnapshot()
  const selectedProject = useSelectedProject()
  const organization = useSelectedOrganization()

  const readReplicasEnabled = useFlag('readReplicas')
  const showReadReplicasUI = readReplicasEnabled && selectedProject?.is_read_replicas_enabled
  const connectionStringsRef = useRef<HTMLDivElement>(null)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

  // [Joshen] TODO this needs to be obtained from BE as 26th Jan is when we'll start - projects will be affected at different rates
  const resolvesToIpV6 = false // Number(new Date()) > Number(dayjs.utc('01-26-2024', 'MM-DD-YYYY').toDate())

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const {
    data,
    error: projectSettingsError,
    isLoading: isLoadingProjectSettings,
    isError: isErrorProjectSettings,
    isSuccess: isSuccessProjectSettings,
  } = useProjectSettingsQuery({ projectRef })
  const { data: resourceWarnings } = useResourceWarningsQuery()
  const {
    data: databases,
    error: readReplicasError,
    isLoading: isLoadingReadReplicas,
    isError: isErrorReadReplicas,
    isSuccess: isSuccessReadReplicas,
  } = useReadReplicasQuery({ projectRef })
  const error = showReadReplicasUI ? readReplicasError : projectSettingsError
  const isLoading = showReadReplicasUI ? isLoadingReadReplicas : isLoadingProjectSettings
  const isError = showReadReplicasUI ? isErrorReadReplicas : isErrorProjectSettings
  const isSuccess = showReadReplicasUI ? isSuccessReadReplicas : isSuccessProjectSettings

  const selectedDatabase = (databases ?? []).find(
    (db) => db.identifier === state.selectedDatabaseId
  )

  const isReadOnlyMode =
    (resourceWarnings ?? [])?.find((warning) => warning.project === projectRef)
      ?.is_readonly_mode_enabled ?? false

  const { project } = data ?? {}
  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
  const connectionInfo = showReadReplicasUI
    ? pluckObjectFields(selectedDatabase || emptyState, DB_FIELDS)
    : pluckObjectFields(project || emptyState, DB_FIELDS)

  const handleCopy = (labelValue?: string) =>
    Telemetry.sendEvent(
      {
        category: 'settings',
        action: 'copy_connection_string',
        label: labelValue ? labelValue : '',
      },
      telemetryProps,
      router
    )

  useEffect(() => {
    if (connectionString !== undefined && connectionStringsRef.current !== undefined) {
      state.setSelectedDatabaseId(connectionString)
      connectionStringsRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [connectionString])

  return (
    <>
      <section id="direct-connection">
        {isReadOnlyMode && (
          <Alert_Shadcn_ variant="destructive">
            <IconAlertTriangle />
            <AlertTitle_Shadcn_>
              Project is in read-only mode and database is no longer accepting write requests
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              You have reached 95% of your project's disk space, and read-only mode has been enabled
              to preserve your database's stability and prevent your project from exceeding its
              current billing plan. To resolve this, you may:
              <ul className="list-disc pl-6 mt-1">
                <li>
                  Temporarily disable read-only mode to free up space and reduce your database size
                </li>
                {subscription?.plan.id === 'free' ? (
                  <li>
                    <Link href={`/org/${organization?.slug}/billing?panel=subscriptionPlan`}>
                      <a className="text underline">Upgrade to the Pro plan</a>
                    </Link>{' '}
                    to increase your database size limit to 8GB.
                  </li>
                ) : subscription?.plan.id === 'pro' && subscription?.usage_billing_enabled ? (
                  <li>
                    <Link href={`/org/${organization?.slug}/billing?panel=subscriptionPlan`}>
                      <a className="text-foreground underline">Disable your Spend Cap</a>
                    </Link>{' '}
                    to allow your project to auto-scale and expand beyond the 8GB database size
                    limit
                  </li>
                ) : null}
              </ul>
            </AlertDescription_Shadcn_>
            <div className="mt-4 flex items-center space-x-2">
              <Button type="default" onClick={() => setShowConfirmationModal(true)}>
                Disable read-only mode
              </Button>
              <Button asChild type="default" icon={<IconExternalLink />}>
                <Link
                  href="https://supabase.com/docs/guides/platform/database-size#disabling-read-only-mode"
                  target="_blank"
                  rel="noreferrer"
                >
                  Learn more
                </Link>
              </Button>
            </div>
          </Alert_Shadcn_>
        )}

        <Panel
          title={
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <h5 className="mb-0">Connect to your database directly</h5>
                <Badge color={resolvesToIpV6 ? 'amber' : 'scale'}>
                  {resolvesToIpV6 ? 'Resolves to IPv6' : 'Resolves to IPv4'}
                </Badge>
              </div>
              {showReadReplicasUI && <DatabaseSelector />}
            </div>
          }
          className="!m-0"
        >
          <Panel.Content className="space-y-6">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="grid gap-2 items-center md:grid md:grid-cols-12 md:gap-x-4 w-full"
                >
                  <ShimmeringLoader className="h-4 w-1/3 col-span-4" delayIndex={i} />
                  <ShimmeringLoader className="h-8 w-full col-span-8" delayIndex={i} />
                </div>
              ))}
            {isError && <AlertError error={error} subject="Failed to retrieve databases" />}
            {isSuccess && (
              <>
                <Alert_Shadcn_ variant="warning">
                  <IconAlertTriangle strokeWidth={2} />
                  <AlertTitle_Shadcn_>
                    Direct database access via IPv4 and pgBouncer will be removed from January 26th
                    2024
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_ className="space-y-3">
                    <p>
                      We strongly recommend using{' '}
                      <span
                        tabIndex={0}
                        className="cursor-pointer text-foreground underline underline-offset-[4px] decoration-brand-500 hover:decoration-foreground"
                        onClick={() => {
                          const connectionPooler = document.getElementById('connection-pooler')
                          connectionPooler?.scrollIntoView({ block: 'center', behavior: 'smooth' })
                        }}
                      >
                        connection pooling
                      </span>{' '}
                      to connect to your database. You'll only need to change the connection string
                      that you're using in your application to the pooler's connection string which
                      can be found in the{' '}
                      <span
                        tabIndex={0}
                        className="cursor-pointer text-foreground underline underline-offset-[4px] decoration-brand-500 hover:decoration-foreground"
                        onClick={() => {
                          const connectionPooler = document.getElementById('connection-pooler')
                          connectionPooler?.scrollIntoView({ block: 'center', behavior: 'smooth' })
                        }}
                      >
                        connection pooling settings
                      </span>
                      .
                    </p>
                    <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                      <a
                        href="https://github.com/orgs/supabase/discussions/17817"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Learn more
                      </a>
                    </Button>
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
                <Input
                  className="input-mono"
                  layout="horizontal"
                  readOnly
                  copy
                  disabled
                  value={connectionInfo.db_host}
                  label="Host"
                  onCopy={() => {
                    handleCopy('Host')
                  }}
                />

                <Input
                  className="input-mono"
                  layout="horizontal"
                  readOnly
                  copy
                  disabled
                  value={connectionInfo.db_name}
                  label="Database name"
                />

                <Input
                  className="input-mono"
                  layout="horizontal"
                  readOnly
                  copy
                  disabled
                  value={connectionInfo.db_port.toString()}
                  label="Port"
                />

                <Input
                  layout="horizontal"
                  className="input-mono table-input-cell text-base"
                  readOnly
                  copy
                  disabled
                  value={connectionInfo.db_user}
                  label="User"
                />

                <Input
                  className="input-mono"
                  layout="horizontal"
                  disabled
                  readOnly
                  value={
                    state.selectedDatabaseId !== projectRef
                      ? '[The password for your primary database]'
                      : '[The password you provided when you created this project]'
                  }
                  label="Password"
                />
              </>
            )}
          </Panel.Content>
          <Separator />
          <DatabaseConnectionString />
        </Panel>
      </section>

      <ResetDbPassword disabled={isLoading || isError} />

      <ConfirmDisableReadOnlyModeModal
        visible={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
      />
    </>
  )
}

export default DatabaseSettings
