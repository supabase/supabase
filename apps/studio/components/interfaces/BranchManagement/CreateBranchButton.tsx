import { PermissionAction } from '@supabase/shared-types/out/constants'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useAppStateSnapshot } from '@/state/app-state'

export const CreateBranchButton = () => {
  const snap = useAppStateSnapshot()
  const { can: canCreateBranches } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'preview_branches',
    { resource: { is_default: false } }
  )

  return (
    <ButtonTooltip
      variant="primary"
      disabled={!canCreateBranches}
      onClick={() => snap.setShowCreateBranchModal(true)}
      tooltip={{
        content: {
          side: 'bottom',
          text: !canCreateBranches
            ? 'You need additional permissions to create branches'
            : undefined,
        },
      }}
    >
      Create branch
    </ButtonTooltip>
  )
}
