import { FC, useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from 'hooks'
import { pluckObjectFields } from 'lib/helpers'
import Loading from 'components/ui/Loading'
import Panel from 'components/ui/Panel'
import Divider from 'components/ui/Divider'
import { AutoField } from 'uniforms-bootstrap4'
import { API_URL } from 'lib/constants'
import { patch } from 'lib/common/fetch'
import ToggleField from 'components/to-be-cleaned/forms/ToggleField'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'
import { Input } from 'ui'

interface Props {}

const ConnectionPooling: FC<Props> = () => {
  const { ui, app } = useStore()
  const projectRef = ui.selectedProject?.ref ?? 'default'

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [poolingConfiguration, setPoolingConfiguration] = useState<any>()

  useEffect(() => {
    fetchPoolingConfiguration()
  }, [])

  const fetchPoolingConfiguration = async () => {
    setIsLoading(true)
    const response = await app.database.getPoolingConfiguration(projectRef)
    setPoolingConfiguration(response)
    setIsLoading(false)
  }

  if (isLoading) return <Loading />
  if (poolingConfiguration.error) {
    return (
      <div className="p-4">
        <p className="text-scale-1000">Error loading pooling configuration</p>
      </div>
    )
  }

  const { project } = poolingConfiguration

  // for older projects
  if (!project.pgbouncer_enabled && project.pool_mode == null)
    return (
      <Panel
        title={
          <h5 key="panel-title" className="mb-0">
            Connection Pooling is not available for this project
          </h5>
        }
      >
        <Panel.Content>
          <p className="text-scale-1000">Please start a new project to enable this feature.</p>
        </Panel.Content>
      </Panel>
    )
  const formModel = project
  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const connectionInfo = pluckObjectFields(formModel, DB_FIELDS)
  const BOUNCER_FIELDS = [
    'default_pool_size',
    'ignore_startup_parameters',
    'pool_mode',
    'pgbouncer_enabled',
  ]
  const bouncerInfo = pluckObjectFields(formModel, BOUNCER_FIELDS)

  return (
    <PgbouncerConfig
      projectRef={projectRef}
      bouncerInfo={bouncerInfo}
      connectionInfo={connectionInfo}
    />
  )
}

export default observer(ConnectionPooling)

interface ConfigProps {
  projectRef: string
  bouncerInfo: {
    default_pool_size: number
    ignore_startup_parameters: 'string'
    pool_mode: string
    pgbouncer_enabled: boolean
  }
  connectionInfo: {
    db_host: string
    db_name: string
    db_port: number
    db_user: string
    inserted_at: string
  }
}

export const PgbouncerConfig: FC<ConfigProps> = observer(
  ({ projectRef, bouncerInfo, connectionInfo }) => {
    const { ui } = useStore()

    const [updates, setUpdates] = useState<any>({
      pgbouncer_enabled: bouncerInfo.pgbouncer_enabled,
      pool_mode: bouncerInfo.pool_mode || 'transaction',
      default_pool_size: bouncerInfo.default_pool_size || '',
      ignore_startup_parameters: bouncerInfo.ignore_startup_parameters || '',
    })

    const updateConfig = async (updatedConfig: any) => {
      try {
        const response = await patch(`${API_URL}/props/pooling/${projectRef}/config`, updatedConfig)
        if (response.error) {
          throw response.error
        } else {
          setUpdates({ ...response.project })
          ui.setNotification({ category: 'success', message: 'Successfully saved settings' })
        }
      } catch (error: any) {
        ui.setNotification({
          category: 'error',
          message: `Failed to update config: ${error.message}`,
        })
      }
    }

    const formSchema = {
      properties: {
        pgbouncer_enabled: {
          title: 'Enabled',
          type: 'boolean',
          help: 'Activates / deactivates Connection Pooling.',
        },
        pool_mode: {
          title: 'Pool Mode',
          type: 'string',
          options: [
            {
              label: 'Transaction',
              value: 'transaction',
            },
            {
              label: 'Session',
              value: 'session',
            },
            {
              label: 'Statement',
              value: 'statement',
            },
          ],
        },
        ignore_startup_parameters: {
          title: 'Ignore Startup Parameters',
          type: 'string',
          readOnly: true,
          help: 'Defaults are either blank or "extra_float_digits"',
        },
      },
      required: ['pool_mode'],
      type: 'object',
    }

    return (
      <div>
        <SchemaFormPanel
          title="Connection Pooling"
          schema={formSchema}
          model={updates}
          submitLabel="Save"
          cancelLabel="Cancel"
          onChangeModel={(model: any) => setUpdates(model)}
          onSubmit={(model: any) => updateConfig(model)}
          onReset={() => setUpdates(bouncerInfo)}
        >
          <div className="space-y-6 py-4">
            <ToggleField name="pgbouncer_enabled" />

            <Divider light />

            {updates.pgbouncer_enabled && (
              <>
                <AutoField
                  name="pool_mode"
                  showInlineError
                  errorMessage="You must select one of the three options"
                />
                <div className="!mt-1 flex" style={{ marginLeft: 'calc(33% + 0.5rem)' }}>
                  <p className="text-sm text-scale-900">
                    Specify when a connection can be returned to the pool. To find out the most
                    suitable mode for your use case,{' '}
                    <a
                      className="text-green-900"
                      target="_blank"
                      href="https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pool"
                    >
                      click here
                    </a>
                    .
                  </p>
                </div>
                <Divider light />
                <AutoField name="ignore_startup_parameters" />
              </>
            )}
            <Divider light />
            <Input
              className="input-mono"
              layout="horizontal"
              readOnly
              copy
              disabled
              value={connectionInfo.db_port}
              label="Port"
            />
            <Divider light />
            <Input
              className="input-mono"
              layout="vertical"
              readOnly
              copy
              disabled
              label="Connection string"
              value={
                `postgres://${connectionInfo.db_user}:[YOUR-PASSWORD]@` +
                `${connectionInfo.db_host}:${connectionInfo.db_port}` +
                `/${connectionInfo.db_name}`
              }
            />
          </div>
        </SchemaFormPanel>
      </div>
    )
  }
)
