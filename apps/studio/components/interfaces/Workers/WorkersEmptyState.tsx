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
    <div className="flex flex-col items-center gap-y-8 rounded-lg border border-dashed bg-surface-100 px-6 py-10 lg:flex-row lg:items-center lg:justify-center lg:gap-x-16 lg:px-12">
      {/* Main content + CTA — same EmptyStatePresentational, stripped of its own card chrome so the outer wrapper is the only visible border. */}
      <EmptyStatePresentational
        icon={BoxPlus}
        title="Deploy your first worker"
        description="Run backend workers in microVMs next to your database. Dockerfile, Node.js and Deno supported at Private Alpha."
        className="w-full border-0 bg-transparent p-0 lg:w-auto"
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
      </EmptyStatePresentational>

      <div className="flex w-full flex-col items-center gap-y-3 lg:w-[440px] lg:shrink-0">
        <p className="text-sm text-foreground-light">Quickstart with a snippet</p>
        <WorkerPromptPanel input={EXAMPLE_WORKER} className="w-full text-left" />
      </div>
    </div>
  )
}
