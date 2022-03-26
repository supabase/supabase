import { FC, useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Input, Typography } from '@supabase/ui'

import { useStore } from 'hooks'
import { pluckObjectFields } from 'lib/helpers'
import Loading from 'components/ui/Loading'
import Panel from 'components/to-be-cleaned/Panel'
import PgBouncerConfig from './PgBouncerConfig'
import DownloadCertificate from './DownloadCertificate'

import Divider from 'components/ui/Divider'

interface Props {}

const BouncerSettings: FC<Props> = ({}) => {
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
        <Typography.Text type="secondary">Error loading pooling configuration</Typography.Text>
      </div>
    )
  }

  const { project } = poolingConfiguration

  // for older projects
  if (!project.pgbouncer_enabled && project.pool_mode == null)
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 sm:w-full md:w-3/4 mx-auto text-center">
        <Typography.Title level={3}>
          Connection Pooling is not available for this project
        </Typography.Title>
        <Typography.Text>Start a new project to enable this feature.</Typography.Text>
      </div>
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
    <article className="p-4 max-w-4xl">
      <div className="mb-8">
        <PgBouncerConfig config={bouncerInfo} projectRef={projectRef} />
      </div>

      <Panel
        title={[
          <Typography.Title key="panel-title" level={5} className="mb-0">
            Connection info
          </Typography.Title>,
        ]}
      >
        <div className="">
          <Panel.Content>
            <Input
              label="Host"
              layout="horizontal"
              descriptionText="This is the url of your database"
              readOnly
              copy
              disabled
              value={connectionInfo.db_host}
            />
          </Panel.Content>
          <Divider light />
          <Panel.Content>
            <Input
              label="Database name"
              style={{
                width: '50%',
              }}
              readOnly
              disabled
              value={connectionInfo.db_name}
              layout="horizontal"
            />
          </Panel.Content>
          <Divider light />
          <Panel.Content>
            <Input
              label="Port"
              style={{
                width: '50%',
              }}
              readOnly
              disabled
              value={connectionInfo.db_port}
              layout="horizontal"
            />
          </Panel.Content>
          <Divider light />
          <Panel.Content>
            <Input
              label="User"
              style={{
                width: '50%',
              }}
              readOnly
              disabled
              value={connectionInfo.db_user}
              layout="horizontal"
            />
          </Panel.Content>
          <Divider light />
          <Panel.Content>
            <Input
              label="Password"
              disabled
              readOnly
              value={'[The password you provided when you created this project]'}
              layout="horizontal"
            />
          </Panel.Content>
          <Divider light />
          <Panel.Content>
            <DownloadCertificate createdAt={connectionInfo.inserted_at} />
          </Panel.Content>
        </div>
      </Panel>

      <section>
        <Panel
          title={[
            <Typography.Title key="panel-title" level={5} className="mb-0">
              Connection string
            </Typography.Title>,
          ]}
        >
          <Panel.Content className="space-y-4">
            <Input
              copy
              readOnly
              disabled
              layout="vertical"
              value={
                `postgres://${connectionInfo.db_user}:[YOUR-PASSWORD]@` +
                `${connectionInfo.db_host}:${connectionInfo.db_port}` +
                `/${connectionInfo.db_name}`
              }
            />

            <div className="flex space-x-3">
              <p className="text-sm text-scale-1100">
                <p>
                  Learn more about connection strings{' '}
                  <Typography.Link href="https://supabase.com/docs/reference/postgres/connection-strings">
                    with Supabase
                  </Typography.Link>{' '}
                  and{' '}
                  <Typography.Link href="https://www.postgresql.org/docs/current/libpq-connect.html">
                    read the official documentation
                  </Typography.Link>
                  .
                </p>
              </p>
            </div>
          </Panel.Content>
        </Panel>
      </section>
    </article>
  )
}

export default observer(BouncerSettings)
