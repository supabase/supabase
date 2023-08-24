import { Button, IconGitBranch } from 'ui'

import { useSelectedOrganization } from 'hooks'
import { useAppUiStateSnapshot } from 'state/app'
import BranchingWaitlistPopover from './BranchingWaitlistPopover'

interface EnableBranchingButtonProps {
  alt?: boolean
}

const EnableBranchingButton = ({ alt = false }: EnableBranchingButtonProps) => {
  const snap = useAppUiStateSnapshot()
  const selectedOrg = useSelectedOrganization()

  const hasAccessToBranching =
    selectedOrg?.opt_in_tags?.includes('PREVIEW_BRANCHES_OPT_IN') ?? false

  if (!hasAccessToBranching) {
    return <BranchingWaitlistPopover alt={alt} />
  }

  return (
    <Button
      type={alt ? 'text' : 'default'}
      icon={<IconGitBranch strokeWidth={1.5} />}
      onClick={() => snap.setShowEnableBranchingModal(true)}
    >
      Enable branching
    </Button>
  )
}

export default EnableBranchingButton
