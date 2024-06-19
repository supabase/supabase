import { AVAILABLE_REPLICA_REGIONS } from 'components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { last } from 'lodash'

export const formatDatabaseID = (id: string) => last(id.split('-') ?? [])

export const formatDatabaseRegion = (region: string) =>
  last(AVAILABLE_REPLICA_REGIONS.find((r) => r.region === region)?.name.split('('))?.split(')')[0]
