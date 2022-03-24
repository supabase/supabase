import useSWR from 'swr'
import {
  Dispatch,
  FC,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { indexOf } from 'lodash'
import { useRouter } from 'next/router'
import { AutoField } from 'uniforms-bootstrap4'
import { observer, useLocalObservable } from 'mobx-react-lite'
import {
  JwtSecretUpdateError,
  JwtSecretUpdateProgress,
  JwtSecretUpdateStatus,
} from '@supabase/shared-types/out/events'
import {
  Alert,
  Typography,
  Input,
  IconAlertCircle,
  Modal,
  IconKey,
  Button,
  Dropdown,
  IconPenTool,
  IconRefreshCw,
  IconChevronDown,
  IconLoader,
} from '@supabase/ui'

import { API_URL } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { patch, get } from 'lib/common/fetch'
import { useStore, useJwtSecretUpdateStatus, withAuth } from 'hooks'

import { SettingsLayout } from 'components/layouts'
import Flag from 'components/ui/Flag/Flag'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'

import Panel from 'components/to-be-cleaned/Panel'
import MultiSelectUI from 'components/to-be-cleaned/MultiSelect'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'
import { DisplayApiSettings } from 'components/to-be-cleaned/DisplayProjectSettings'

const JWT_SECRET_UPDATE_ERROR_MESSAGES = {
  [JwtSecretUpdateError.APIServicesConfigurationUpdateFailed]:
    'failed to update configuration for API services',
  [JwtSecretUpdateError.APIServicesRestartFailed]: 'failed to restart API services',
  [JwtSecretUpdateError.DatabaseAdminAPIConfigurationUpdateFailed]:
    'failed to update configuration for database admin API',
  [JwtSecretUpdateError.PostgreSQLRestartFailed]: 'failed to restart PostgreSQL service',
  [JwtSecretUpdateError.SupabaseAPIKeyUpdateFailed]: 'failed to update Supabase API key',
}

const JWT_SECRET_UPDATE_PROGRESS_MESSAGES = {
  [JwtSecretUpdateProgress.RestartedAPIServices]: 'restarted API services',
  [JwtSecretUpdateProgress.RestartedPostgreSQL]: 'restarted PostgreSQL service',
  [JwtSecretUpdateProgress.Started]: 'started updating',
  [JwtSecretUpdateProgress.UpdatedAPIServicesConfiguration]:
    'updated configuration for API services',
  [JwtSecretUpdateProgress.UpdatedDatabaseAdminAPIConfiguration]:
    'updated configuration for database admin API',
}

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
  const [isSubmittingJwtSecretUpdateRequest, setIsSubmittingJwtSecretUpdateRequest] =
    useState<boolean>(false)

  const {
    data,
    error,
    mutate: mutateSettings,
  }: any = useSWR(`${API_URL}/props/project/${projectRef}/settings`, get)
  const { data: config, mutate: mutateConfig }: any = useSWR(
    `${API_URL}/projects/${projectRef}/config?app=postgrest`,
    get
  )
  const {
    changeTrackingId,
    isError: isJwtSecretUpdateStatusError,
    isLoading: isJwtSecretUpdateStatusLoading,
    jwtSecretUpdateError,
    jwtSecretUpdateProgress,
    jwtSecretUpdateStatus,
    mutateJwtSecretUpdateStatus,
  }: any = useJwtSecretUpdateStatus(ref)

  const { Failed, Updated, Updating } = JwtSecretUpdateStatus

  const isJwtSecretUpdateFailed = jwtSecretUpdateStatus === Failed
  const isNotUpdatingJwtSecret =
    jwtSecretUpdateStatus === undefined || jwtSecretUpdateStatus === Updated
  const isUpdatingJwtSecret = jwtSecretUpdateStatus === Updating
  const jwtSecretUpdateErrorMessage =
    JWT_SECRET_UPDATE_ERROR_MESSAGES[jwtSecretUpdateError as JwtSecretUpdateError]
  const jwtSecretUpdateProgressMessage =
    JWT_SECRET_UPDATE_PROGRESS_MESSAGES[jwtSecretUpdateProgress as JwtSecretUpdateProgress]

  const previousJwtSecretUpdateStatus = useRef()

  useEffect(() => {
    if (previousJwtSecretUpdateStatus.current === Updating) {
      switch (jwtSecretUpdateStatus) {
        case Updated:
          mutateConfig()
          mutateSettings()
          ui.setNotification({ category: 'success', message: 'Successfully updated JWT secret' })
          break
        case Failed:
          ui.setNotification({
            category: 'error',
            message: `JWT secret update failed: ${jwtSecretUpdateErrorMessage}`,
          })
          break
      }
    }

    previousJwtSecretUpdateStatus.current = jwtSecretUpdateStatus
  }, [jwtSecretUpdateStatus])

  if (error || isJwtSecretUpdateStatusError) {
    return (
      <div className="p-6 mx-auto sm:w-full md:w-3/4 text-center">
        <Typography.Title level={3}>Error loading API settings</Typography.Title>
      </div>
    )
  }
  if (!data || isJwtSecretUpdateStatusLoading) {
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

  async function handleJwtSecretUpdate(
    jwt_secret: string,
    setModalVisibility: Dispatch<SetStateAction<boolean>>
  ) {
    setIsSubmittingJwtSecretUpdateRequest(true)
    try {
      const trackingId = uuidv4()
      const res = await patch(`${API_URL}/projects/${ref}/config?app=secrets`, {
        jwt_secret,
        change_tracking_id: trackingId,
      })
      if (res.error) throw res.error
      setModalVisibility(false)
      mutateJwtSecretUpdateStatus()
      ui.setNotification({
        category: 'info',
        message:
          'Successfully submitted JWT secret update request. Please wait while your project is updated.',
      })
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: error.message })
    } finally {
      setIsSubmittingJwtSecretUpdateRequest(false)
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
                Configuration
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
                copy={isNotUpdatingJwtSecret}
                reveal={isNotUpdatingJwtSecret}
                disabled
                value={
                  isJwtSecretUpdateFailed
                    ? 'JWT secret update failed'
                    : isUpdatingJwtSecret
                    ? 'Updating JWT secret...'
                    : config?.jwt_secret || ''
                }
                className="input-mono"
                descriptionText={
                  'Used to decode your JWTs. You can also use this to mint your own JWTs.'
                }
                layout="horizontal"
              />
              <Flag name="jwtSecretUpdate">
                <div className="space-y-3">
                  <div className="p-3 px-6 dark:bg-bg-alt-dark bg-bg-alt-light rounded-md shadow-sm border dark:border-dark">
                    {isUpdatingJwtSecret ? (
                      <div className="flex items-center space-x-2">
                        <IconLoader className="animate-spin" size={14} />
                        <p className="text-sm">
                          Updating JWT secret: {jwtSecretUpdateProgressMessage}
                        </p>
                      </div>
                    ) : (
                      <div className="w-full space-y-2">
                        <div className="w-full flex items-center justify-between">
                          <div className="flex flex-col space-y-1">
                            <Typography.Text>Generate a new JWT secret</Typography.Text>
                            <p className="opacity-50 text-sm">
                              A random secret will be created, or you can create your own.
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            {isUpdatingJwtSecret ? (
                              <Button loading type="secondary">
                                Updating JWT secret...
                              </Button>
                            ) : (
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
                                    <Dropdown.Seperator />
                                    <Dropdown.Item
                                      onClick={() => setIsCreatingKey(true)}
                                      icon={<IconPenTool size={16} />}
                                    >
                                      Create my own secret
                                    </Dropdown.Item>
                                  </>
                                }
                              >
                                <Button as="span" type="default" iconRight={<IconChevronDown />}>
                                  Generate a new secret
                                </Button>
                              </Dropdown>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {isJwtSecretUpdateFailed ? (
                    <Alert withIcon variant="warning" title="Failed to update JWT secret">
                      Please try again. If the failures persist, please contact Supabase support
                      with the following details: <br />
                      Change tracking ID: {changeTrackingId} <br />
                      Error message: {jwtSecretUpdateErrorMessage}
                    </Alert>
                  ) : (
                    <Alert
                      withIcon
                      variant="warning"
                      title="This will invalidate all existing API keys!"
                    >
                      Your project will also be restarted during this process, which will terminate
                      any existing connections.
                    </Alert>
                  )}
                </div>
              </Flag>
            </Panel.Content>
          </Panel>
        </section>
        <section>{config && <PostgrestConfig config={config} projectRef={projectRef} />}</section>
      </article>

      <ConfirmModal
        danger
        visible={isRegeneratingKey}
        title="Are you absolutely sure?"
        description="This action cannot be undone and the old JWT secret will be lost. All existing API keys
        will be invalidated, and any open connections will be terminated."
        buttonLabel="Generate new secret"
        buttonLoadingLabel="Generating"
        onSelectCancel={() => setIsGeneratingKey(false)}
        onSelectConfirm={() => handleJwtSecretUpdate('ROLL', setIsGeneratingKey)}
      />

      <Modal
        closable
        header="Create a custom JWT secret"
        visible={isCreatingKey}
        size="medium"
        variant="danger"
        loading={isSubmittingJwtSecretUpdateRequest}
        customFooter={
          <div className="space-x-2">
            <Button type="default" onClick={() => setIsCreatingKey(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              disabled={customToken.length < 32}
              loading={isSubmittingJwtSecretUpdateRequest}
              onClick={() => handleJwtSecretUpdate(customToken, setIsCreatingKey)}
            >
              Apply new JWT secret
            </Button>
          </div>
        }
      >
        <Modal.Content>
          <div className="py-4 space-y-2">
            <p className="text-sm text-scale-1100">
              Create a custom JWT secret. Make sure it is a strong combination of characters that
              cannot be guessed easily.
            </p>
            <Alert
              withIcon
              variant="warning"
              title="All existing API keys will be invalidated, and any open connections will be terminated."
            />
            <Input
              onChange={(e: any) => setCustomToken(e.target.value)}
              value={customToken}
              icon={<IconKey />}
              type="password"
              className="w-full text-left"
              label="Custom JWT secret"
              descriptionText="Must be at least 32 characters long"
            />
          </div>
        </Modal.Content>
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
