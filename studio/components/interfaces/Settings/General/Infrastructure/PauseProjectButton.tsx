import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, IconPause } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'

interface Props {
  projectId: number
  projectRef: string
}

const PauseProjectButton: FC<Props> = observer(({ projectRef, projectId }) => {
  const { ui, app } = useStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const isPaused = ui?.selectedProject?.status === PROJECT_STATUS.INACTIVE
  const canPauseProject = checkPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_jobs.projects.pause'
  )

  const requestPauseProject = async () => {
    if (!canPauseProject) {
      return ui.setNotification({
        category: 'error',
        message: 'You do not have the required permissions to pause this project',
      })
    }

    setLoading(true)
    const res = await post(`${API_URL}/projects/${projectRef}/pause`, {})

    if (res.error) {
      ui.setNotification({
        error: res.error,
        category: 'error',
        message: 'Failed to pause project',
      })
      setLoading(false)
    } else {
      app.onProjectPaused(projectId)
      app.onProjectStatusUpdated(projectId, PROJECT_STATUS.GOING_DOWN)

      ui.setNotification({ category: 'success', message: 'Pausing project' })
      router.push(`/project/${projectRef}`)
    }
    closeModal()
  }

  return (
    <>
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger>
          <Button
            type="default"
            icon={<IconPause />}
            onClick={openModal}
            loading={loading}
            disabled={isPaused || !canPauseProject}
          >
            Pause Project
          </Button>
        </Tooltip.Trigger>
        {isPaused ? (
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'rounded bg-scale-100 py-1 px-2 leading-none shadow', // background
                'border border-scale-200 ', //border
              ].join(' ')}
            >
              <span className="text-xs text-scale-1200">Your project is already paused</span>
            </div>
          </Tooltip.Content>
        ) : !canPauseProject ? (
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'rounded bg-scale-100 py-1 px-2 leading-none shadow', // background
                'border border-scale-200 ', //border
              ].join(' ')}
            >
              <span className="text-xs text-scale-1200">
                You need additional permissions to pause this project
              </span>
            </div>
          </Tooltip.Content>
        ) : (
          <></>
        )}
      </Tooltip.Root>
      <ConfirmModal
        danger
        visible={isModalOpen}
        title="Pause this project?"
        description="Are you sure you want to pause this project? It will not be accessible until you unpause it."
        buttonLabel="Pause project"
        buttonLoadingLabel="Pausing project"
        onSelectCancel={closeModal}
        onSelectConfirm={requestPauseProject}
      />
    </>
  )
})

export default PauseProjectButton
