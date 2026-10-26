import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useAppStateSnapshot } from '@/state/app-state'

export const CreateBranchButton = () => {
  const snap = useAppStateSnapshot()
  const { can: canCreateBranches } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_CREATE
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
