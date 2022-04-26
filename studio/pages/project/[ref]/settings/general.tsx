import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { toJS } from 'mobx'
import { projects } from 'stores/jsonSchema'
import { AutoField } from 'uniforms-bootstrap4'
import { Alert, Button, Input, IconRefreshCcw } from '@supabase/ui'

import { API_URL } from 'lib/constants'
import { pluckJsonSchemaFields, pluckObjectFields } from 'lib/helpers'
import { post, delete_ } from 'lib/common/fetch'
import { useStore, withAuth } from 'hooks'
import { SettingsLayout } from 'components/layouts'
import Panel from 'components/to-be-cleaned/Panel'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'
import TextConfirmModal from 'components/to-be-cleaned/ModalsDeprecated/TextConfirmModal'

const ProjectSettings = () => {
  return (
    <SettingsLayout title="General">
      <div className="content w-full h-full overflow-y-auto">
        <div className="mx-auto w-full">
          <GeneralSettings />
        </div>
      </div>
    </SettingsLayout>
  )
}

export default withAuth(observer(ProjectSettings))

interface RestartServerButtonProps {
  projectId: number
  projectRef: string
}
const RestartServerButton: FC<RestartServerButtonProps> = observer(({ projectRef, projectId }) => {
  const { ui, app } = useStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const requestServerRestart = async () => {
    setLoading(true)
    try {
      await post(`${API_URL}/projects/${projectRef}/restart`, {})
      app.onProjectPostgrestStatusUpdated(projectId, 'OFFLINE')
      ui.setNotification({ category: 'success', message: 'Restarting server' })
      router.push(`/project/${projectRef}`)
    } catch (error) {
      ui.setNotification({ error, category: 'error', message: 'Unable to restart server' })
      setLoading(false)
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

const GeneralSettings = observer(() => {
  const { app, ui } = useStore()
  const project = ui.selectedProject
  const formModel = toJS(project)
  const BASIC_FIELDS = ['name']

  const handleUpdateProject = async (model: any) => {
    const response = await post(`${API_URL}/projects/${project?.ref}/update`, model)
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Update project failed: ${response.error.message}`,
      })
    } else {
      const updatedProject = response
      app.onProjectUpdated(updatedProject)
      ui.setNotification({ category: 'success', message: 'Successfully saved settings' })
    }
  }

  return (
    <article className="p-4 max-w-4xl">
      <section>
        <SchemaFormPanel
          title="General"
          schema={pluckJsonSchemaFields(projects, BASIC_FIELDS)}
          model={formModel}
          onSubmit={(model: any) => handleUpdateProject(pluckObjectFields(model, BASIC_FIELDS))}
        >
          <AutoField name="name" showInlineError errorMessage="Please enter a project name" />
        </SchemaFormPanel>
      </section>

      <section>
        <Panel
          title={
            <h5 key="panel-title" className="text-base mb-0">
              Infrastructure
            </h5>
          }
        >
          <Panel.Content>
            <Input
              readOnly
              disabled
              value={project?.cloud_provider}
              label="Cloud provider"
              layout="horizontal"
            />
          </Panel.Content>
          <Panel.Content className="border-t border-panel-border-interior-light dark:border-panel-border-interior-dark">
            <Input readOnly disabled value={project?.region} label="Region" layout="horizontal" />
          </Panel.Content>
          <Panel.Content className="border-t border-panel-border-interior-light dark:border-panel-border-interior-dark">
            <div className="w-full flex items-center justify-between">
              <div>
                <p>Restart server</p>
                <div style={{ maxWidth: '420px' }}>
                  <p className="opacity-50 text-sm">
                    Your project will not be available for a few minutes.
                  </p>
                </div>
              </div>
              {project && <RestartServerButton projectId={project.id} projectRef={project.ref} />}
            </div>
          </Panel.Content>
        </Panel>
      </section>

      <section>
        <Panel title={<p className="uppercase">Danger Zone</p>}>
          <Panel.Content>
            <Alert
              variant="danger"
              withIcon
              title="Deleting this project will also remove your database."
            >
              <div className="flex flex-col">
                <p className="block mb-4">
                  Make sure you have made a backup if you want to keep your data.
                </p>
                <ProjectDeleteModal project={project} />
              </div>
            </Alert>
          </Panel.Content>
        </Panel>
      </section>
    </article>
  )
})

const ProjectDeleteModal = ({ project }: any) => {
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
      <div className="mt-2">
        <Button onClick={toggle} type="danger">
          Delete Project
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
