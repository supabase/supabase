import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Button, IconPause, Modal } from 'ui'

import {
  useIsProjectActive,
  useProjectContext,
} from 'components/layouts/ProjectLayout/ProjectContext'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useProjectPauseMutation } from 'data/projects/project-pause-mutation'
import { setProjectStatus } from 'data/projects/projects-query'
import { useCheckPermissions, useStore } from 'hooks'
import { PROJECT_STATUS } from 'lib/constants'

const PauseProjectButton = () => {
  const { ui } = useStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { project } = useProjectContext()
  const isProjectActive = useIsProjectActive()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const projectRef = project?.ref ?? ''
  const isPaused = project?.status === PROJECT_STATUS.INACTIVE
  const canPauseProject = useCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_jobs.projects.pause'
  )

  const { mutate: pauseProject, isLoading: isPausing } = useProjectPauseMutation({
    onSuccess: (res, variables) => {
      setProjectStatus(queryClient, variables.ref, PROJECT_STATUS.PAUSING)
      ui.setNotification({ category: 'success', message: 'Pausing project...' })
      router.push(`/project/${projectRef}`)
    },
  })

  const requestPauseProject = () => {
    if (!canPauseProject) {
      return ui.setNotification({
        category: 'error',
        message: 'You do not have the required permissions to pause this project',
      })
    }
    pauseProject({ ref: projectRef })
  }

  return (
    <>
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger>
          <Button
            type="default"
            icon={<IconPause />}
            onClick={() => setIsModalOpen(true)}
            loading={isPausing}
            disabled={project === undefined || isPaused || !canPauseProject || !isProjectActive}
          >
            Pause Project
          </Button>
        </Tooltip.Trigger>
        {project !== undefined && (isPaused || !canPauseProject || !isProjectActive) ? (
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                  'border border-background', //border
                ].join(' ')}
              >
                <span className="text-xs text-foreground">
                  {isPaused
                    ? 'Your project is already paused'
                    : !canPauseProject
                    ? 'You need additional permissions to pause this project'
                    : !isProjectActive
                    ? 'Unable to pause project as project is not active'
                    : ''}
                </span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        ) : null}
      </Tooltip.Root>
      <ConfirmationModal
        danger
        visible={isModalOpen}
        loading={isPausing}
        header="Pause this project?"
        description=""
        buttonLabel="Pause project"
        buttonLoadingLabel="Pausing project"
        onSelectCancel={() => setIsModalOpen(false)}
        onSelectConfirm={requestPauseProject}
      >
        <Modal.Content className="py-4">
          <p className="text-foreground-light text-sm">
            Are you sure you want to pause this project? It will not be accessible until you unpause
            it.
          </p>
        </Modal.Content>
      </ConfirmationModal>
    </>
  )
}

export default PauseProjectButton
