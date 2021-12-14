import useSWR from 'swr'
import { FC, createContext, useContext, useState } from 'react'
import { indexOf } from 'lodash'
import { useRouter } from 'next/router'
import { AutoField } from 'uniforms-bootstrap4'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { Typography, Input, IconAlertCircle, Modal, IconKey } from '@supabase/ui'

import { API_URL } from 'lib/constants'
import { useStore, withAuth } from 'hooks'
import { patch, get } from 'lib/common/fetch'
import { SettingsLayout } from 'components/layouts'
import Panel from 'components/to-be-cleaned/Panel'
import MultiSelectUI from 'components/to-be-cleaned/MultiSelect'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'
import { DisplayApiSettings } from 'components/to-be-cleaned/DisplayProjectSettings'
import ConfirmationModal from 'components/ui/ConfirmationModal'

const PageContext: any = createContext(null)

const ApiSettings = () => {
  const router = useRouter()
  const { ref } = router.query

  const { meta, ui } = useStore()
  const project = ui.selectedProject

  // page context
  const PageState: any = useLocalObservable(() => ({
    project: null,
    projectRef: ref,
    meta: null,
  }))

  PageContext.meta = meta
  PageContext.project = project

  // load schemas
  const load = async () => {
    await meta.schemas.load()
  }

  if (meta) {
    PageState.meta = meta
    load()
  }

  return (
    <SettingsLayout title="API Settings">
      <PageContext.Provider value={PageState}>
        <div className="content w-full h-full overflow-y-auto">
          <ServiceList projectRef={ref} />
        </div>
      </PageContext.Provider>
    </SettingsLayout>
  )
}

export default withAuth(observer(ApiSettings))

const ServiceList: FC<any> = ({ projectRef }) => {
  const { ui } = useStore()
  const router = useRouter()
  const { ref } = router.query

  const [customToken, setCustomToken] = useState<string>('')
  const [isRegeneratingKey, setIsGeneratingKey] = useState<boolean>(false)
  const [isCreatingKey, setIsCreatingKey] = useState<boolean>(false)
  const [isLoadingCreatingKey, setIsLoadingCreatingKey] = useState<boolean>(false)

  const {
    data,
    error,
    mutate: mutateSettings,
  }: any = useSWR(`${API_URL}/props/project/${projectRef}/settings`, get)
  const { data: config, mutate: mutateConfig }: any = useSWR(
    `${API_URL}/projects/${projectRef}/config?app=postgrest`,
    get
  )

  if (error) {
    return (
      <div className="p-6 mx-auto sm:w-full md:w-3/4 text-center">
        <Typography.Title level={3}>Error loading API settings</Typography.Title>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="p-6 mx-auto sm:w-full md:w-3/4 text-center">
        <Typography.Title level={3}>Loading...</Typography.Title>
      </div>
    )
  }

  const { services } = data

  // Get the API service
  const API_SERVICE_ID = 1
  const apiService = services.find((x: any) => x.app.id == API_SERVICE_ID)
  const apiConfig = apiService?.app_config

  async function handleGenerateNewJwtToken() {
    try {
      const res = await patch(`${API_URL}/projects/${ref}/config?app=secrets`, {
        jwt_secret: 'ROLL',
      })
      if (res.error) throw res.error
      setIsGeneratingKey(false)
      // refetch data in forms
      mutateSettings()
      mutateConfig()
      ui.setNotification({ category: 'success', message: 'Successfully updated JWT secret' })
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: error.message })
    }
  }

  async function handleCustomNewJwtToken() {
    setIsLoadingCreatingKey(true)
    try {
      const res = await patch(`${API_URL}/projects/${ref}/config?app=secrets`, {
        jwt_secret: customToken,
      })
      if (res.error) throw res.error
      setIsCreatingKey(false)
      // refetch data in forms
      mutateSettings()
      mutateConfig()
      ui.setNotification({ category: 'success', message: 'Successfully updated JWT secret' })
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: error.message })
    } finally {
      setIsLoadingCreatingKey(false)
    }
  }

  return (
    <>
      <article className="p-4 max-w-4xl">
        <DisplayApiSettings key="DisplayAPISettings" />
        <section>
          <Panel
            title={
              <Typography.Title level={5} className="mb-0">
                Config
              </Typography.Title>
            }
          >
            <Panel.Content>
              <Input
                copy
                label="URL"
                readOnly
                disabled
                className="input-mono"
                value={`https://${apiConfig?.endpoint ?? '-'}`}
                descriptionText="A RESTful endpoint for querying and managing your database."
                layout="horizontal"
              />
            </Panel.Content>
            <Panel.Content className="border-t border-panel-border-interior-light dark:border-panel-border-interior-dark space-y-6">
              <Input
                label="JWT Secret"
                readOnly
                copy
                reveal
                disabled={true}
                value={config?.jwt_secret || ''}
                className="input-mono"
                descriptionText={
                  'Used to decode your JWTs. You can also use this to mint your own JWTs.'
                }
                layout="horizontal"
              />
              {/* Temporarily hide the jwt secret rolling feature */}
              {/* <div className="space-y-3">
                <div className="p-3 px-6 dark:bg-bg-alt-dark bg-bg-alt-light rounded-md shadow-sm border dark:border-dark flex items-center justify-between">
                  <div>
                    <Typography.Text>Generate a new JWT secret</Typography.Text>
                    <div>
                      <Typography.Text type="secondary">
                        A random secret will be created, or you can create your own.
                      </Typography.Text>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Dropdown
                      align="end"
                      side="bottom"
                      overlay={
                        <>
                          <Dropdown.Item
                            onClick={() => setIsGeneratingKey(true)}
                            icon={<IconRefreshCw size={16} />}
                          >
                            Generate a random secret
                          </Dropdown.Item>
                          <Divider light />
                          <Dropdown.Item
                            onClick={() => setIsCreatingKey(true)}
                            icon={<IconPenTool size={16} />}
                          >
                            Create my own secret
                          </Dropdown.Item>
                        </>
                      }
                    >
                      <Button as="span" type="secondary" iconRight={<IconChevronDown />}>
                        Generate a new secret
                      </Button>
                    </Dropdown>
                  </div>
                </div>
              </div> */}
            </Panel.Content>
          </Panel>
        </section>
        <section>{config && <PostgrestConfig config={config} projectRef={projectRef} />}</section>
      </article>
      <ConfirmationModal
        danger
        visible={isRegeneratingKey}
        title="Generate new JWT secret"
        buttonLabel="Generate new secret"
        buttonLoadingLabel="Generating"
        children={
          <Typography.Text type="secondary">
            Are you sure you want to genereate a random new JWT secret? This action cannot be undone
            and the old JWT secret will be lost.
          </Typography.Text>
        }
        onSelectCancel={() => setIsGeneratingKey(false)}
        onSelectConfirm={handleGenerateNewJwtToken}
      />
      <Modal
        closable
        title="Create a custom JWT secret"
        visible={isCreatingKey}
        size="small"
        confirmText="Apply new JWT secret"
        variant="danger"
        alignFooter="right"
        loading={isLoadingCreatingKey}
        onCancel={() => setIsCreatingKey(false)}
        onConfirm={handleCustomNewJwtToken}
      >
        <Typography.Text type="secondary">
          Create a custom JWT secret. Make sure it is a strong combination of characters that cannot
          be guessed easily.
        </Typography.Text>
        <Input
          onChange={(e: any) => setCustomToken(e.target.value)}
          value={customToken}
          icon={<IconKey />}
          type="password"
          className="w-full text-left"
          label="Custom JWT secret"
          descriptionText="Must be at least 32 characters long"
        />
      </Modal>
    </>
  )
}

const PostgrestConfig = observer(({ config, projectRef }: any) => {
  const PageState: any = useContext(PageContext)
  const { ui } = useStore()
  const { meta } = PageState

  const [updates, setUpdates] = useState({
    db_schema: config.db_schema,
    max_rows: config.max_rows,
    db_extra_search_path: config.db_extra_search_path || '',
  })

  const updateConfig = async (updatedConfig: any) => {
    try {
      const response = await patch(
        `${API_URL}/projects/${projectRef}/config?app=postgrest`,
        updatedConfig
      )
      if (response.error) {
        throw response.error
      } else {
        ui.setNotification({ category: 'success', message: 'Successfully saved settings' })
      }
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to update config: ${error.message}`,
      })
    }
  }

  // manually filter out following schema
  const hiddenSchema = ['auth', 'pgbouncer', 'hooks', 'extensions']
  // following schema is permament
  const permanentSchema = ['public', 'storage']
  // construct list of schema for input controller
  const schema =
    meta.schemas
      .list(
        (x: any) => {
          const find = indexOf(hiddenSchema, x.name)
          if (find < 0) return x
        },
        { allSchemas: true }
      )
      .map((x: any) => {
        return {
          id: x.id,
          value: x.name,
          name: x.name,
          disabled: indexOf(permanentSchema, x.name) >= 0 ? true : false,
        }
      }) ?? []

  return (
    <>
      <SchemaFormPanel
        title="Settings"
        schema={{
          properties: {
            db_schema: {
              title: 'Schema',
              type: 'string',
              help: 'The schema to expose in your API. Tables, views and stored procedures in this schema will get API endpoints. Multiple schemas must be comma-separated.',
            },
            max_rows: {
              title: 'Max Rows',
              type: 'integer',
              help: 'The maximum number of rows returns from a view, table, or stored procedure. Limits payload size for accidental or malicious requests.',
            },
            db_extra_search_path: {
              title: 'Extra search path',
              type: 'string',
              help: 'Extra schemas to add to the search_path of every request. Multiple schemas must be comma-separated.',
            },
          },
          required: ['max_rows'],
          type: 'object',
        }}
        model={updates}
        onSubmit={(model: any) => updateConfig(model)}
        onReset={() => setUpdates(config)}
      >
        <div className="space-y-6 py-4">
          {schema.length >= 1 && (
            <MultiSelectUI
              options={schema}
              // value must be passed as array of strings
              value={updates.db_schema.replace(/ /g, '').split(',')}
              // onChange returns array of strings
              onChange={(event) => {
                let payload = updates
                payload.db_schema = event.join(', ') // permanentSchema.concat(event).join(', ')
                setUpdates({ ...payload })
                updateConfig({ ...payload })
              }}
              label={'Schema'}
              descriptionText={
                <>
                  The schema to expose in your API. Tables, views and stored procedures in this
                  schema will get API endpoints.<code>public</code> and <code>storage</code> are
                  protected by default.
                </>
              }
              emptyMessage={
                <>
                  <Typography.Text className="mb-2">
                    <IconAlertCircle />
                  </Typography.Text>
                  <Typography.Text>No schema available to choose</Typography.Text>
                  <div>
                    <Typography.Text small className="opacity-50">
                      New schema you create will appear here
                    </Typography.Text>
                  </div>
                </>
              }
            />
          )}
          <AutoField name="db_extra_search_path" showInlineError errorMessage="Must be a string." />
          <AutoField name="max_rows" showInlineError errorMessage="Must be a number." />
        </div>
      </SchemaFormPanel>
    </>
  )
})
