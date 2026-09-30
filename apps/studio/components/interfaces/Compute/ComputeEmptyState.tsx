import { BoxPlus } from 'icons'
import { Plus } from 'lucide-react'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'

interface ComputeEmptyStateProps {
  onDeploy: () => void
}

export const ComputeEmptyState = ({ onDeploy }: ComputeEmptyStateProps) => {
  const { can: canDeployInstances } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.WORKERS_WRITE
  )

  return (
    <EmptyStatePresentational
      icon={BoxPlus}
      title="Deploy your first Compute instance"
      description="Spin up a Compute instance locally, then deploy it to the cloud. Dockerfile, Node.js and Deno supported at Private Alpha."
    >
      <ButtonTooltip
        variant="primary"
        size="tiny"
        icon={<Plus size={14} />}
        disabled={!canDeployInstances}
        onClick={onDeploy}
        tooltip={{
          content: {
            side: 'bottom',
            text: canDeployInstances
              ? undefined
              : 'You need additional permissions to deploy compute instances',
          },
        }}
      >
        Deploy
      </ButtonTooltip>
    </EmptyStatePresentational>
  )
}
