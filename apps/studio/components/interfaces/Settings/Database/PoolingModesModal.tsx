import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
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
      size="xlarge"
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
        <Markdown
          className="max-w-full [&>h3]:text-sm"
          content={`
A connection pooler is a system (external to Postgres) which manages Postgres connections
by allocating connections whenever clients make requests. Each pooling mode handles
connections differently.

### Transaction mode
This mode is recommended if you are connecting from *serverless environments*. A connection is assigned to the client for the duration of a transaction. Two consecutive transactions from the same client could be executed over two different connections. Some session-based Postgres features such as prepared statements are *not available* with this option.

### Session mode
This mode is similar to connecting to your database directly. There is full support for prepared statements in this mode. When a new client connects, a connection is assigned to the client until it disconnects. You *might run into pooler connection limits* since the connection is held till the client disconnects.

### Using session and transaction modes at the same time
 ${
   data?.pool_mode === 'transaction'
     ? 'You can use the session mode connection string (port 5432) and transaction mode connection string (port 6543) in your application.'
     : 'To get the best of both worlds, as a starting point, we recommend using session mode just when you need support for prepared statements and transaction mode in other cases.'
 }
`}
        />
        {data?.pool_mode === 'session' && (
          <Alert_Shadcn_ variant="warning">
            <AlertTriangleIcon strokeWidth={2} />
            <AlertTitle_Shadcn_>
              Pooling mode is currently configured to use session mode
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              To use transaction mode concurrently with session mode, change the pooling mode to
              transaction first in the{' '}
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
              . After this, you can use transaction mode on port 6543 and session mode on port 5432.
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}
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
