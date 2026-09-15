import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { DeleteProjectModal } from './DeleteProjectModal'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export interface DeleteProjectButtonProps {
  variant?: 'danger' | 'default'
}

export const DeleteProjectButton = ({ variant = 'danger' }: DeleteProjectButtonProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [isOpen, setIsOpen] = useState(false)

  const { can: canDeleteProject } = useAsyncCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: { project_id: project?.id },
  })

  return (
    <>
      <ButtonTooltip
        variant={variant}
        disabled={!canDeleteProject}
        onClick={() => setIsOpen(true)}
        tooltip={{
          content: {
            side: 'bottom',
            text: !canDeleteProject
              ? 'You need additional permissions to delete this project'
              : undefined,
          },
        }}
      >
        Delete project
      </ButtonTooltip>
      <DeleteProjectModal visible={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
