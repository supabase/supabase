import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import DeleteProjectModal from './DeleteProjectModal'

export interface DeleteProjectButtonProps {
  type?: 'danger' | 'default'
}

const DeleteProjectButton = ({ type = 'danger' }: DeleteProjectButtonProps) => {
  const { project } = useProjectContext()
  const [isOpen, setIsOpen] = useState(false)

  const canDeleteProject = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: { project_id: project?.id },
  })

  return (
    <>
      <ButtonTooltip
        type={type}
        disabled={!canDeleteProject}
        onClick={() => setIsOpen(true)}
        tooltip={{
          content: {
            side: 'bottom',
            text: 'You need additional permissions to delete this project',
          },
        }}
      >
        Delete project
      </ButtonTooltip>
      <DeleteProjectModal visible={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

export default DeleteProjectButton
