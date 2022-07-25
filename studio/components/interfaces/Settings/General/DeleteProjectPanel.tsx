import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { Alert, Button } from '@supabase/ui'

import { useStore } from 'hooks'
import { API_URL } from 'lib/constants'
import { delete_ } from 'lib/common/fetch'
import Panel from 'components/ui/Panel'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'

interface Props {}

const DeleteProjectPanel: FC<Props> = ({}) => {
  const router = useRouter()
  const { app, ui } = useStore()
  const project = ui.selectedProject

  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

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

  if (project === undefined) return <></>

  return (
    <>
      <section>
        <Panel title={<p className="uppercase">Danger Zone</p>}>
          <Panel.Content>
            <Alert
              variant="danger"
              withIcon
              title="Deleting this project will also remove your database."
            >
              <div className="flex flex-col">
                <p className="mb-4 block">
                  Make sure you have made a backup if you want to keep your data.
                </p>
                <div className="flex items-center">
                  <Button onClick={toggle} type="danger">
                    Delete project
                  </Button>
                </div>
              </div>
            </Alert>
          </Panel.Content>
        </Panel>
      </section>
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

export default DeleteProjectPanel
