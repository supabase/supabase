import { FC, useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Typography } from '@supabase/ui'
import { useStore } from 'hooks'
import { pluckObjectFields } from 'lib/helpers'
import Loading from 'components/ui/Loading'
import PgBouncerConfig from './PgBouncerConfig'
import Panel from 'components/to-be-cleaned/Panel'

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
      <Panel
      title={
        <Typography.Title key="panel-title" level={5} className="mb-0">
         Connection Pooling is not available for this project
        </Typography.Title>
      }
    >
        <Panel.Content>
          <Typography.Text type="secondary">Please start a new project to enable this feature.</Typography.Text>
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

          <PgBouncerConfig config={bouncerInfo} projectRef={projectRef} />

  )
}

export default observer(BouncerSettings)
