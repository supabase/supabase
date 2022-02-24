import React, { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { toJS } from 'mobx'
import { projects } from 'stores/jsonSchema'
import { AutoField } from 'uniforms-bootstrap4'
import {
  Modal,
  Alert,
  Button,
  Input,
  Typography,
  IconAlertCircle,
  IconRefreshCcw,
} from '@supabase/ui'

import { API_URL } from 'lib/constants'
import { pluckJsonSchemaFields, pluckObjectFields } from 'lib/helpers'
import { post, delete_ } from 'lib/common/fetch'
import { useStore, withAuth } from 'hooks'
import { SettingsLayout } from 'components/layouts'
import Panel from 'components/to-be-cleaned/Panel'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'
import ConfirmModal from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModalV2'

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

const RestartServerButton: FC<any> = ({ projectRef }: any) => {
  const { ui } = useStore()
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const requestServerRestart = async () => {
    setLoading(true)
    try {
      await post(`${API_URL}/projects/${projectRef}/restart`, {})
      ui.setNotification({ category: 'info', message: 'Requested server restart' })
      setLoading(false)
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
}

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
            <Typography.Title key="panel-title" level={5} className="mb-0">
              Infrastructure
            </Typography.Title>
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
                <Typography.Text className="block">Restart Server</Typography.Text>
                <div style={{ maxWidth: '320px' }}>
                  <Typography.Text type="secondary" className="opacity-50">
                    Restart your project server
                  </Typography.Text>
                </div>
              </div>
              <RestartServerButton projectRef={project?.ref} />
            </div>
          </Panel.Content>
        </Panel>
      </section>

      <section>
        <Panel title={<Typography.Text className="uppercase">Danger Zone</Typography.Text>}>
          <Panel.Content>
            <Alert
              variant="danger"
              withIcon
              // @ts-ignore
              title={
                <Typography.Text>
                  Deleting this project will also remove your database.
                </Typography.Text>
              }
            >
              <Typography.Text className="block mb-4">
                Make sure you have made a backup if you want to keep your data.
              </Typography.Text>
              <ProjectDeleteModal project={project} />
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
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  const toggle = () => {
    if (loading) return
    setIsOpen(!isOpen)
  }

  async function handleDeleteProject() {
    setLoading(true)
    try {
      const response = await delete_(`${API_URL}/projects/${project.ref}/remove`)
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
      <Button onClick={toggle} danger>
        Delete Project
      </Button>
      <Modal
        visible={isOpen}
        onCancel={toggle}
        title={'Are you absolutely sure?'}
        icon={<IconAlertCircle background={'red'} />}
        hideFooter
        size="medium"
        closable
      >
        <Typography.Text>
          <p className="text-sm">
            This action <Typography.Text strong>cannot</Typography.Text> be undone. This will
            permanently delete the <Typography.Text strong>{project?.name}</Typography.Text> project
            and all of its data.
          </p>
          <p className="text-sm">
            Please type <Typography.Text strong>{project?.name}</Typography.Text> to confirm.
          </p>
        </Typography.Text>
        <Input
          onChange={(e) => setValue(e.target.value)}
          value={value}
          className="w-full"
          placeholder="Type the project name in here "
        />
        <Button
          onClick={handleDeleteProject}
          loading={loading}
          disabled={project?.name !== value || loading}
          size="small"
          block
          danger
        >
          I understand, delete this project
        </Button>
      </Modal>
    </>
  )
}
