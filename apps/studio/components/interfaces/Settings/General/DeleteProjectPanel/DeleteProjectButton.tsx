import { useState } from 'react'

import { DeleteProjectModal } from './DeleteProjectModal'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'

export interface DeleteProjectButtonProps {
  variant?: 'danger' | 'default'
}

export const DeleteProjectButton = ({ variant = 'danger' }: DeleteProjectButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const { can: canDeleteProject } = useAsyncCheckPermissionsV2(FGA_PERMISSIONS.PROJECT.ADMIN_WRITE)

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
