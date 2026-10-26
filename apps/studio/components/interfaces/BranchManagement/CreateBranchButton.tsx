import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useGrant } from '@/lib/grants'
import { useAppStateSnapshot } from '@/state/app-state'

export const CreateBranchButton = () => {
  const snap = useAppStateSnapshot()
  const createBranchGrant = useGrant('POST /v1/projects/{ref}/branches', {})
  const canCreateBranches = createBranchGrant.status === 'granted'

  return (
    <ButtonTooltip
      variant="primary"
      disabled={!canCreateBranches}
      onClick={() => snap.setShowCreateBranchModal(true)}
      tooltip={{
        content: {
          side: 'bottom',
          text:
            createBranchGrant.status === 'denied'
              ? 'You need additional permissions to create branches'
              : createBranchGrant.status === 'error'
                ? `Failed to check permissions`
                : undefined,
        },
      }}
    >
      Create branch
    </ButtonTooltip>
  )
}
