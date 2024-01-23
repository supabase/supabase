import { AlertTitle } from '@ui/components/shadcn/ui/alert'
import { useParams } from 'common'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import { AlertTriangleIcon } from 'lucide-react'
import { useDatabaseSettingsStateSnapshot } from 'state/database-settings'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconExternalLink,
  Modal,
} from 'ui'

export const PoolingModesModal = () => {
  const { ref: projectRef } = useParams()
  const snap = useDatabaseSettingsStateSnapshot()

  const { data } = usePoolingConfigurationQuery({ projectRef: projectRef })

  const navigateToPoolerSettings = () => {
    const el = document.getElementById('connection-pooler')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <Modal
      hideFooter
      visible={snap.showPoolingModeHelper}
      header={
        <div className="w-full flex items-center justify-between">
          <p>Which pooling mode should I use?</p>
          <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
            <a
              href="https://supabase.com/docs/guides/database/connecting-to-postgres#how-connection-pooling-works"
              target="_blank"
              rel="noreferrer"
            >
              Documentation
            </a>
          </Button>
        </div>
      }
      onCancel={() => snap.setShowPoolingModeHelper(false)}
    >
      <Modal.Content className="py-4 text-sm flex flex-col gap-y-4">
        <p className="text-foreground-light">
          A "connection pool" is a system (external to Postgres) which manages Postgres connections
          by allocating connections whenever clients make requests. Each pooling mode handles
          connections differently.
        </p>
        <div className="flex flex-col gap-y-1">
          <p>Transaction mode (Port: 6543)</p>
          <p className="text-foreground-light">
            Recommended if you are connecting from{' '}
            <span className="text-foreground">serverless environments</span> since the same database
            connection can be re-used across multiple clients connecting to the pooler.{' '}
            <span className="text-amber-900">
              Prepared statements don't work in transaction mode
            </span>
            .
          </p>
          {data?.pool_mode === 'session' && (
            <Alert_Shadcn_ variant="warning">
              <AlertTriangleIcon strokeWidth={2} />
              <AlertTitle_Shadcn_>
                Pooling mode is currently configured to use session mode
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                To use transaction mode on port 6543, change the pooling mode to transaction first
                in the{' '}
                <span
                  tabIndex={0}
                  className="text-foreground cursor-pointer underline underline-offset-2"
                  onClick={() => {
                    snap.setShowPoolingModeHelper(false)
                    navigateToPoolerSettings()
                  }}
                >
                  connection pooling settings
                </span>
                .
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}
        </div>
        <div className="flex flex-col gap-y-1">
          <p>Session mode (Port: 5432)</p>
          <p className="text-foreground-light">
            Similar to connecting to your database directly. There is{' '}
            <span className="text-foreground">full support for prepared statements</span> but a new
            database connection is created for each client and you{' '}
            <span className="text-amber-900">might run into database connection limits</span>.
          </p>
        </div>
        <p className="text-foreground-light">
          If you want to use both session mode and transaction mode at the same time, change the
          pooling mode to transaction first in the{' '}
          <span
            tabIndex={0}
            className="text-foreground cursor-pointer underline underline-offset-2"
            onClick={() => {
              snap.setShowPoolingModeHelper(false)
              navigateToPoolerSettings()
            }}
          >
            connection pooling settings
          </span>
          . You can then connect to session mode on port 5432 and transaction mode on port 6543.
        </p>
      </Modal.Content>
      <Modal.Separator />
      <Modal.Content className="flex items-center justify-end pb-2">
        <Button type="default" onClick={() => snap.setShowPoolingModeHelper(false)}>
          Close
        </Button>
      </Modal.Content>
    </Modal>
  )
}
