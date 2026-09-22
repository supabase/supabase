import { PermissionAction } from '@supabase/shared-types/out/constants'
import { BoxPlus } from 'icons'
import { Plus } from 'lucide-react'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

interface ComputeEmptyStateProps {
  onDeploy: () => void
}

export const ComputeEmptyState = ({ onDeploy }: ComputeEmptyStateProps) => {
  const { can: canDeployInstances } = useAsyncCheckPermissions(
    PermissionAction.FUNCTIONS_WRITE,
    '*'
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
