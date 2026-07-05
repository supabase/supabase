import { Box, Loader2, LogOut, RefreshCw } from 'lucide-react'
import { Badge, Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { usePostgresSandbox } from '@/state/postgres-sandbox/sandbox'

export const SandboxManagement = () => {
  const { status, error, isSyncing, startSandbox, destroySandbox, syncSandbox } =
    usePostgresSandbox()

  if (status === 'idle') {
    return (
      <Admonition
        type="default"
        layout="horizontal"
        className="min-h-min border-none [&>div>div>div>div>p]:!mb-0 [&>div>div]:gap-x-2"
        actions={[
          <Button key="sandbox" variant="default" onClick={() => startSandbox()}>
            Set up sandbox
          </Button>,
        ]}
      >
        <div className="flex items-center gap-x-2">
          <p className="text-foreground !m-0">Run queries in a sandbox</p>
          <Badge variant="success">Recommended</Badge>
        </div>
        <p className="text-foreground-light !m-0">
          Ensure that queries do not affect your actual database
        </p>
      </Admonition>
    )
  }

  if (status === 'loading') {
    return (
      <Admonition
        showIcon={false}
        type="default"
        className="min-h-min border-none py-2 [&>div>div]:flex [&>div>div]:items-center [&>div>div]:justify-between"
      >
        <div className="flex items-center gap-x-3">
          <div className="bg w-6 h-6 rounded border border-border flex items-center justify-center">
            <Loader2 size={14} className="animate-spin" />
          </div>
          <p className="text-xs !mb-0 font-mono uppercase tracking-tight">Setting up sandbox</p>
        </div>
      </Admonition>
    )
  }

  if (status === 'error') {
    return (
      <Admonition
        type="warning"
        layout="horizontal"
        title="Unable to set up sandbox"
        description={error ?? 'Please try again'}
        className="min-h-min border-none"
        actions={[
          <Button key="set-up" variant="default" onClick={() => startSandbox()}>
            Retry set up
          </Button>,
        ]}
      />
    )
  }

  return (
    <Admonition
      showIcon={false}
      type="default"
      layout="horizontal"
      className="min-h-min border-none py-2 [&>div>div>div>div>p]:!mb-0 [&>div>div]:gap-x-2"
      actions={[
        <ButtonTooltip
          key="destroy"
          variant="default"
          icon={<LogOut />}
          className="w-7"
          disabled={isSyncing}
          tooltip={{ content: { side: 'bottom', text: 'Exit sandbox' } }}
          onClick={() => destroySandbox()}
        />,
        <ButtonTooltip
          key="refresh"
          variant="default"
          icon={<RefreshCw />}
          className="w-7"
          loading={isSyncing}
          tooltip={{ content: { side: 'bottom', text: 'Refresh schema' } }}
          onClick={() => syncSandbox()}
        />,
      ]}
    >
      <div className="flex items-center gap-x-3">
        <div className="bg-brand-300 w-6 h-6 rounded border border-brand-500 flex items-center justify-center">
          <Box size={14} className="text-brand" />
        </div>
        <p className="text-xs text-foreground font-mono uppercase tracking-tight">Sandbox active</p>
        <p className="text-xs text-foreground-lighter ">Your database is never modified</p>
      </div>
    </Admonition>
  )
}
