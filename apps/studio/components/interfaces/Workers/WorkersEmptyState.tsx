import { PermissionAction } from '@supabase/shared-types/out/constants'
import { BoxPlus } from 'icons'
import { Terminal } from 'lucide-react'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

interface WorkersEmptyStateProps {
  onDeploy: () => void
}

export const WorkersEmptyState = ({ onDeploy }: WorkersEmptyStateProps) => {
  const { can: canDeployWorkers } = useAsyncCheckPermissions(PermissionAction.FUNCTIONS_WRITE, '*')

  return (
    <EmptyStatePresentational
      icon={BoxPlus}
      title="Deploy your first worker"
      description="Run backend workers in microVMs next to your database. Dockerfile, Node.js and Deno supported at Private Alpha."
    >
      <ButtonTooltip
        variant="primary"
        size="tiny"
        icon={<Terminal size={14} />}
        disabled={!canDeployWorkers}
        onClick={onDeploy}
        tooltip={{
          content: {
            side: 'bottom',
            text: canDeployWorkers
              ? undefined
              : 'You need additional permissions to deploy workers',
          },
        }}
      >
        Deploy a worker
      </ButtonTooltip>
    </EmptyStatePresentational>
  )
}
