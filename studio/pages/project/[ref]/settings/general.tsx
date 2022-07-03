import { observer } from 'mobx-react-lite'
import { toJS } from 'mobx'
import { projects } from 'stores/jsonSchema'
import { AutoField } from 'uniforms-bootstrap4'
import { Alert, Input } from '@supabase/ui'

import { useFlag, useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import { post } from 'lib/common/fetch'
import { API_URL, PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { pluckJsonSchemaFields, pluckObjectFields } from 'lib/helpers'
import { SettingsLayout } from 'components/layouts'
import {
  RestartServerButton,
  PauseProjectButton,
  DeleteProjectButton,
} from 'components/interfaces/Settings/General'

import Panel from 'components/ui/Panel'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'

const ProjectSettings: NextPageWithLayout = () => {
  return (
    <div>
      <div className="content h-full w-full overflow-y-auto">
        <div className="mx-auto w-full">
          <GeneralSettings />
        </div>
      </div>
    </div>
  )
}

ProjectSettings.getLayout = (page) => <SettingsLayout title="General">{page}</SettingsLayout>

export default observer(ProjectSettings)

const GeneralSettings = observer(() => {
  const { app, ui } = useStore()
  const isProjectPauseEnabled = useFlag('projectPausing')

  const project = ui.selectedProject
  const formModel = toJS(project)
  const BASIC_FIELDS = ['name']

  const isFreeProject = project?.subscription_tier === PRICING_TIER_PRODUCT_IDS.FREE

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
    <article className="max-w-4xl p-4">
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
            <h5 key="panel-title" className="mb-0 text-base">
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
          <Panel.Content className="border-panel-border-interior-light dark:border-panel-border-interior-dark border-t">
            <Input readOnly disabled value={project?.region} label="Region" layout="horizontal" />
          </Panel.Content>
          <Panel.Content className="border-panel-border-interior-light dark:border-panel-border-interior-dark border-t">
            <div className="flex w-full items-center justify-between">
              <div>
                <p>Restart server</p>
                <div className="max-w-[420px]">
                  <p className="text-scale-1100 text-sm">
                    Your project will not be available for a few minutes.
                  </p>
                </div>
              </div>
              {project && <RestartServerButton projectId={project.id} projectRef={project.ref} />}
            </div>
          </Panel.Content>
          {isProjectPauseEnabled && isFreeProject && (
            <Panel.Content className="border-panel-border-interior-light dark:border-panel-border-interior-dark border-t">
              <div className="flex w-full items-center justify-between">
                <div>
                  <p>Pause project</p>
                  <div className="max-w-[420px]">
                    <p className="text-scale-1100 text-sm">
                      Your project will not be accessible while it is paused.
                    </p>
                  </div>
                </div>
                {project && <PauseProjectButton projectId={project.id} projectRef={project.ref} />}
              </div>
            </Panel.Content>
          )}
        </Panel>
      </section>

      {project !== undefined && (
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
                  <DeleteProjectButton project={project} />
                </div>
              </Alert>
            </Panel.Content>
          </Panel>
        </section>
      )}
    </article>
  )
})
