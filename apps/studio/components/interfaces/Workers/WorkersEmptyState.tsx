import { PermissionAction } from '@supabase/shared-types/out/constants'
import { BoxPlus } from 'icons'
import { Plus, Terminal } from 'lucide-react'
import { Button } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

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
      description="Spin up and deploy a worker locally, then deploy it to the cloud. Dockerfile, Node.js and Deno supported at Private Alpha."
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
        New worker
      </ButtonTooltip>
      <Button variant="default" size="tiny" icon={<Terminal size={14} />} onClick={onDeploy}>
        Deploy with CLI
      </Button>
    </EmptyStatePresentational>
  )
}
