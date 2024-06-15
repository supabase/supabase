import { Button, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_, Tooltip_Shadcn_ } from 'ui'

import { useCheckPermissions, useFlag, useSelectedProject } from 'hooks'
import { GitBranch } from 'lucide-react'
import { useAppStateSnapshot } from 'state/app-state'
import BranchingWaitListPopover from './BranchingWaitListPopover'
import { PermissionAction } from '@supabase/shared-types/out/constants'

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
    <Tooltip_Shadcn_>
      <TooltipTrigger_Shadcn_ asChild>
        <Button
          type={isNewNav ? 'default' : 'text'}
          icon={<GitBranch strokeWidth={1.5} />}
          disabled={isDisabled}
          className="pointer-events-auto"
          onClick={() => snap.setShowEnableBranchingModal(true)}
        >
          <span>Enable branching</span>
        </Button>
      </TooltipTrigger_Shadcn_>
      {isDisabled && (
        <TooltipContent_Shadcn_ side="bottom">
          {project?.status !== 'ACTIVE_HEALTHY'
            ? 'Unpause your project to enable branching'
            : !canEnableBranching
              ? 'You need additional permissions to enable branching'
              : ''}
        </TooltipContent_Shadcn_>
      )}
    </Tooltip_Shadcn_>
  )
}

export default EnableBranchingButton
