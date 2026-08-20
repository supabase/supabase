import { PermissionAction } from '@supabase/shared-types/out/constants'
import { BoxPlus } from 'icons'
import { Plus, Terminal } from 'lucide-react'
import { Button } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import { EXAMPLE_WORKER } from './workerSnippets'
import { WorkerSnippetTabs } from './WorkerSnippetTabs'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

interface WorkersEmptyStateProps {
  onDeploy: () => void
  onCreate: () => void
}

export const WorkersEmptyState = ({ onDeploy, onCreate }: WorkersEmptyStateProps) => {
  const { can: canDeployWorkers } = useAsyncCheckPermissions(PermissionAction.FUNCTIONS_WRITE, '*')

  return (
    <EmptyStatePresentational
      icon={BoxPlus}
      title="Deploy your first worker"
      description="Run backend workers in microVMs next to your database. Dockerfile, Node.js and Deno supported at Private Alpha, in US West (Oregon)."
      className="gap-y-6 py-8"
    >
      <div className="flex items-center gap-2">
        <ButtonTooltip
          variant="primary"
          size="tiny"
          icon={<Plus size={14} />}
          disabled={!canDeployWorkers}
          onClick={onCreate}
          tooltip={{
            content: {
              side: 'bottom',
              text: canDeployWorkers
                ? undefined
                : 'You need additional permissions to deploy workers',
            },
          }}
        >
          Deploy worker
        </ButtonTooltip>
        <Button variant="default" size="tiny" icon={<Terminal size={14} />} onClick={onDeploy}>
          Deploy with CLI
        </Button>
      </div>

      <div className="w-full max-w-[640px] pt-2">
        <WorkerSnippetTabs input={EXAMPLE_WORKER} tabs={['ai', 'cli', 'curl']} />
      </div>
    </EmptyStatePresentational>
  )
}
