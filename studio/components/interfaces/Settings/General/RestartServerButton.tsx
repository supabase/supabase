import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Button, IconRefreshCcw } from '@supabase/ui'

import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'

interface Props {
  projectId: number
  projectRef: string
}

const RestartServerButton: FC<Props> = observer(({ projectRef, projectId }) => {
  const { ui, app } = useStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const requestServerRestart = async () => {
    setLoading(true)
    const res = await post(`${API_URL}/projects/${projectRef}/restart`, {})

    if (res.error) {
      ui.setNotification({
        error: res.error,
        category: 'error',
        message: 'Unable to restart server',
      })
      setLoading(false)
    } else {
      app.onProjectPostgrestStatusUpdated(projectId, 'OFFLINE')
      ui.setNotification({ category: 'success', message: 'Restarting server' })
      router.push(`/project/${projectRef}`)
    }
    closeModal()
  }

  return (
    <>
      <ConfirmModal
        danger
        visible={isModalOpen}
        title="Restart Server"
        description={`Are you sure you want to restart the server? There will be a few minutes of downtime.`}
        buttonLabel="Restart"
        buttonLoadingLabel="Restarting"
        onSelectCancel={closeModal}
        onSelectConfirm={requestServerRestart}
      />
      <Button type="default" icon={<IconRefreshCcw />} onClick={openModal} loading={loading}>
        Restart server
      </Button>
    </>
  )
})

export default RestartServerButton
