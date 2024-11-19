import { AlertTriangleIcon } from 'lucide-react'

import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { DocsButton } from 'components/ui/DocsButton'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { useDatabaseSettingsStateSnapshot } from 'state/database-settings'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'

export const PoolingModesModal = () => {
  const { ref: projectRef } = useParams()
  const snap = useDatabaseSettingsStateSnapshot()
  const state = useDatabaseSelectorStateSnapshot()

  const { data } = usePoolingConfigurationQuery({ projectRef: projectRef })
  const primaryConfig = data?.find((x) => x.identifier === state.selectedDatabaseId)

  const navigateToPoolerSettings = () => {
    const el = document.getElementById('connection-pooler')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <Dialog open={snap.showPoolingModeHelper} onOpenChange={snap.setShowPoolingModeHelper}>
      <DialogContent hideClose className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            <div className="w-full flex items-center justify-between">
              <p className="max-w-2xl">Which pooling mode should I use?</p>
              <DocsButton href="https://supabase.com/docs/guides/database/connecting-to-postgres#how-connection-pooling-works" />
            </div>
          </DialogTitle>
          <DialogDescription className="max-w-2xl">
            A connection pooler is a system (external to Postgres) which manages Postgres
            connections by allocating connections whenever clients make requests.
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <Markdown
            className="max-w-full [&>h3]:text-sm"
            content={`
Each pooling mode handles connections differently.

### Transaction mode
This mode is recommended if you are connecting from *serverless environments*. A connection is assigned to the client for the duration of a transaction. Two consecutive transactions from the same client could be executed over two different connections. Some session-based Postgres features such as prepared statements are *not available* with this option.

### Session mode
This mode is similar to connecting to your database directly. There is full support for prepared statements in this mode. When a new client connects, a connection is assigned to the client until it disconnects. You *might run into pooler connection limits* since the connection is held till the client disconnects.

### Using session and transaction modes at the same time
 ${
   primaryConfig?.pool_mode === 'transaction'
     ? 'You can use the session mode connection string (port 5432) and transaction mode connection string (port 6543) in your application.'
     : 'To get the best of both worlds, as a starting point, we recommend using session mode just when you need support for prepared statements and transaction mode in other cases.'
 }
`}
          />
        </DialogSection>
        {primaryConfig?.pool_mode === 'session' && (
          <div className="px-6">
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
                . After this, you can use transaction mode on port 6543 and session mode on port
                5432.
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          </div>
        )}
        <DialogFooter>
          <DialogClose onClick={() => snap.setShowPoolingModeHelper(false)}>
            <Button type="default">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
