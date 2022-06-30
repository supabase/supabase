import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Button, IconPause } from '@supabase/ui'

import { useStore } from 'hooks'
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

  const requestPauseProject = async () => {
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
      <Button type="default" icon={<IconPause />} onClick={openModal} loading={loading}>
        Pause Project
      </Button>
    </>
  )
})

export default PauseProjectButton
