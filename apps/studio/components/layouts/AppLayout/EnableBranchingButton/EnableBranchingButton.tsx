import {
  Button,
  IconGitBranch,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'

import { useFlag, useSelectedProject } from 'hooks'
import { useAppStateSnapshot } from 'state/app-state'
import BranchingWaitListPopover from './BranchingWaitListPopover'

interface EnableBranchingButtonProps {
  isNewNav?: boolean
}

const EnableBranchingButton = ({ isNewNav = false }: EnableBranchingButtonProps) => {
  const snap = useAppStateSnapshot()
  const project = useSelectedProject()

  const hasAccessToBranching = useFlag<boolean>('branchManagement')

  if (!hasAccessToBranching) {
    return <BranchingWaitListPopover isNewNav={isNewNav} />
  }

  return (
    <Tooltip_Shadcn_>
      <TooltipTrigger_Shadcn_ asChild>
        <Button
          type={isNewNav ? 'default' : 'text'}
          icon={<IconGitBranch strokeWidth={1.5} />}
          disabled={project?.status !== 'ACTIVE_HEALTHY'}
          onClick={() => snap.setShowEnableBranchingModal(true)}
        >
          Enable branching
        </Button>
      </TooltipTrigger_Shadcn_>
      {project?.status !== 'ACTIVE_HEALTHY' && (
        <TooltipContent_Shadcn_ side="bottom">
          Unpause your project to enable branching
        </TooltipContent_Shadcn_>
      )}
    </Tooltip_Shadcn_>
  )
}

export default EnableBranchingButton
