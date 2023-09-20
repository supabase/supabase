import { Button, IconGitBranch } from 'ui'

import { useSelectedOrganization } from 'hooks'
import { useAppUiStateSnapshot } from 'state/app'
import BranchingWaitlistPopover from './BranchingWaitlistPopover'

import { OPT_IN_TAGS } from 'lib/constants'

interface EnableBranchingButtonProps {
  alt?: boolean // To distinguish slight style change between nav v1 and v2, true for former
}

const EnableBranchingButton = ({ alt = false }: EnableBranchingButtonProps) => {
  const snap = useAppUiStateSnapshot()
  const selectedOrg = useSelectedOrganization()

  const hasAccessToBranching =
    selectedOrg?.opt_in_tags?.includes(OPT_IN_TAGS.PREVIEW_BRANCHES) ?? false

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
