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
    <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <EmptyStatePresentational
          icon={BoxPlus}
          title="Deploy your first worker"
          description="Run backend workers in microVMs next to your database. Dockerfile, Node.js and Deno supported at Private Alpha."
          className="h-full justify-center gap-y-6 py-10"
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
                text: canDeployWorkers
                  ? undefined
                  : 'You need additional permissions to deploy workers',
              },
            }}
          >
            Deploy worker
          </ButtonTooltip>
        </EmptyStatePresentational>
      </div>

      <WorkerPromptPanel input={EXAMPLE_WORKER} className="h-full lg:col-span-2" />
    </div>
  )
}
