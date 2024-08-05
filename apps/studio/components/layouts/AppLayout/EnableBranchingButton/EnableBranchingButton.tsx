import { PermissionAction } from '@supabase/shared-types/out/constants'
import { GitBranch } from 'lucide-react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { useAppStateSnapshot } from 'state/app-state'
import BranchingWaitListPopover from './BranchingWaitListPopover'

interface EnableBranchingButtonProps {
  isNewNav?: boolean
}

const EnableBranchingButton = ({ isNewNav = false }: EnableBranchingButtonProps) => {
  const snap = useAppStateSnapshot()
  const project = useSelectedProject()

  const hasAccessToBranching = useFlag<boolean>('branchManagement')
  const canEnableBranching = useCheckPermissions(PermissionAction.CREATE, 'preview_branches', {
    resource: { is_default: true },
  })
  const isDisabled = !canEnableBranching || project?.status !== 'ACTIVE_HEALTHY'

  if (!hasAccessToBranching) {
    return <BranchingWaitListPopover isNewNav={isNewNav} />
  }

  return (
    <ButtonTooltip
      disabled={isDisabled}
      type={isNewNav ? 'default' : 'text'}
      icon={<GitBranch strokeWidth={1.5} />}
      onClick={() => snap.setShowEnableBranchingModal(true)}
      tooltip={{
        content: {
          side: 'bottom',
          text:
            project?.status !== 'ACTIVE_HEALTHY'
              ? 'Unpause your project to enable branching'
              : !canEnableBranching
                ? 'You need additional permissions to enable branching'
                : undefined,
        },
      }}
    >
      Enable branching
    </ButtonTooltip>
  )
}

export default EnableBranchingButton
