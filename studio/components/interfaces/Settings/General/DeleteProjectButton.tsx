import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@supabase/ui'

import { useStore } from 'hooks'
import { API_URL } from 'lib/constants'
import { delete_ } from 'lib/common/fetch'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import { Project } from 'types'

interface Props {
  project: Project
  type?: 'danger' | 'default'
}

const DeleteProjectButton: FC<Props> = ({ project, type = 'danger' }) => {
  const router = useRouter()
  const { ui, app } = useStore()

  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggle = () => {
    if (loading) return
    setIsOpen(!isOpen)
  }

  async function handleDeleteProject() {
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
      <div className="flex items-center">
        <Button onClick={toggle} type={type}>
          Delete project
        </Button>
      </div>
      <TextConfirmModal
        visible={isOpen}
        loading={loading}
        title={`Confirm deletion of ${project?.name}`}
        confirmPlaceholder="Type the project name in here"
        alert="This action cannot be undone."
        text={`This will permanently delete the ${project?.name} project and all of its data.`}
        confirmString={project?.name}
        confirmLabel="I understand, delete this project"
        onConfirm={handleDeleteProject}
        onCancel={toggle}
      />
    </>
  )
}

export default DeleteProjectButton
