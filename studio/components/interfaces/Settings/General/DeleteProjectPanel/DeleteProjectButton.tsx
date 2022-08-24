import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@supabase/ui'
import * as Tooltip from '@radix-ui/react-tooltip'

import { useStore, checkPermissions, useFlag } from 'hooks'
import { API_URL } from 'lib/constants'
import { delete_ } from 'lib/common/fetch'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { PermissionAction } from '@supabase/shared-types/out/constants'

interface Props {
  type?: 'danger' | 'default'
}

const DeleteProjectButton: FC<Props> = ({ type = 'danger' }) => {
  const router = useRouter()
  const { app, ui } = useStore()
  const enablePermissions = useFlag('enablePermissions')

  const project = ui.selectedProject
  const isOwner = ui.selectedOrganization?.is_owner

  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const canDeleteProject = enablePermissions
    ? checkPermissions(PermissionAction.UPDATE, 'projects')
    : isOwner

  const toggle = () => {
    if (loading) return
    setIsOpen(!isOpen)
  }

  async function handleDeleteProject() {
    if (project === undefined) return

    setLoading(true)
    try {
      const response = await delete_(`${API_URL}/projects/${project.ref}`)
      if (response.error) throw response.error
      app.onProjectDeleted(response)
      ui.setNotification({ category: 'success', message: `Successfully deleted ${project.name}` })
      router.push(`/`)
    } catch (error: any) {
      setLoading(false)
      ui.setNotification({
        category: 'error',
        message: `Failed to delete project ${project.name}: ${error.message}`,
      })
    }
  }

  return (
    <>
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger>
          <Button onClick={toggle} type={type} disabled={!canDeleteProject}>
            Delete project
          </Button>
        </Tooltip.Trigger>
        {!canDeleteProject && (
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'bg-scale-100 rounded py-1 px-2 leading-none shadow', // background
                'border-scale-200 border ', //border
              ].join(' ')}
            >
              <span className="text-scale-1200 text-xs">
                You need additional permissions to delete this project
              </span>
            </div>
          </Tooltip.Content>
        )}
      </Tooltip.Root>
      <TextConfirmModal
        visible={isOpen}
        loading={loading}
        title={`Confirm deletion of ${project?.name}`}
        confirmPlaceholder="Type the project name in here"
        alert="This action cannot be undone."
        text={`This will permanently delete the ${project?.name} project and all of its data.`}
        confirmString={project?.name || ''}
        confirmLabel="I understand, delete this project"
        onConfirm={handleDeleteProject}
        onCancel={toggle}
      />
    </>
  )
}

export default DeleteProjectButton
