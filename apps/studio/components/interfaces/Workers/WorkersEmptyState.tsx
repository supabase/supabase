import { PermissionAction } from '@supabase/shared-types/out/constants'
import { BoxPlus } from 'icons'
import { Plus } from 'lucide-react'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import { EXAMPLE_WORKER } from './workerSnippets'
import { WorkerPromptPanel } from './WorkerPromptPanel'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

interface WorkersEmptyStateProps {
  onCreate: () => void
}

export const WorkersEmptyState = ({ onCreate }: WorkersEmptyStateProps) => {
  const { can: canDeployWorkers } = useAsyncCheckPermissions(PermissionAction.FUNCTIONS_WRITE, '*')

  return (
    <EmptyStatePresentational
      icon={BoxPlus}
      title="Deploy your first worker"
      description="Run backend workers in microVMs next to your database. Dockerfile, Node.js and Deno supported at Private Alpha."
      className="gap-y-8 py-12"
    >
      <ButtonTooltip
        variant="primary"
        size="tiny"
        icon={<Plus size={14} />}
        disabled={!canDeployWorkers}
        onClick={onCreate}
        tooltip={{
          content: {
            side: 'bottom',
            text: canDeployWorkers ? undefined : 'You need additional permissions to deploy workers',
          },
        }}
      >
        Deploy worker
      </ButtonTooltip>

      {/* Capped at 600px and centered regardless of how wide the container grows. */}
      <div className="mx-auto flex w-full max-w-[600px] flex-col items-center gap-y-3 pt-2">
        <p className="text-sm text-foreground-light">Or quickstart a worker with a snippet</p>
        <WorkerPromptPanel input={EXAMPLE_WORKER} className="w-full text-left" />
      </div>
    </EmptyStatePresentational>
  )
}
