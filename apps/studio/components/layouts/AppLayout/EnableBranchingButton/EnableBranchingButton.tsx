import { Button, IconGitBranch } from 'ui'

import { useFlag, useSelectedOrganization } from 'hooks'
import { OPT_IN_TAGS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import BranchingWaitListPopover from './BranchingWaitListPopover'

interface EnableBranchingButtonProps {
  isNewNav?: boolean
}

const EnableBranchingButton = ({ isNewNav = false }: EnableBranchingButtonProps) => {
  const snap = useAppStateSnapshot()
  const selectedOrg = useSelectedOrganization()

  const hasAccessToBranching = useFlag<boolean>('branchManagement')

  if (!hasAccessToBranching) {
    return <BranchingWaitListPopover isNewNav={isNewNav} />
  }

  return (
    <Button
      type={isNewNav ? 'default' : 'text'}
      icon={<IconGitBranch strokeWidth={1.5} />}
      onClick={() => snap.setShowEnableBranchingModal(true)}
    >
      Enable branching
    </Button>
  )
}

export default EnableBranchingButton
