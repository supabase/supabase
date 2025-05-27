import { PermissionAction } from '@supabase/shared-types/out/constants'
import { GitBranch } from 'lucide-react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useAppStateSnapshot } from 'state/app-state'

export const EnableBranchingButton = () => {
  const snap = useAppStateSnapshot()
  const project = useSelectedProject()

  const canEnableBranching = useCheckPermissions(PermissionAction.CREATE, 'preview_branches', {
    resource: { is_default: true },
  })
  const isDisabled = !canEnableBranching || project?.status !== 'ACTIVE_HEALTHY'

  return (
    <ButtonTooltip
      disabled={isDisabled}
      type={'text'}
      icon={<GitBranch strokeWidth={1.5} />}
      onClick={() => snap.setShowEnableBranchingModal(true)}
      className="bg-none hover:bg-none text-foreground-light hover:text-foreground [&_span]:w-full [&_span]:text-left "
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
