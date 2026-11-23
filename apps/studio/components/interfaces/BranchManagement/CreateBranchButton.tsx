import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useGrant, type GrantResult } from '@/lib/grants'
import { useAppStateSnapshot } from '@/state/app-state'

function getDisabledReason({ status }: GrantResult<'POST /v1/projects/{ref}/branches'>) {
  if (status === 'denied') return 'You need additional permissions to create branches'
  if (status === 'error') return 'Failed to check permissions'
  return undefined
}

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
          text: getDisabledReason(createBranchGrant),
        },
      }}
    >
      Create branch
    </ButtonTooltip>
  )
}
