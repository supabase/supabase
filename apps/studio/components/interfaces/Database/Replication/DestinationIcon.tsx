import { BigQuery, ClickHouse, Database } from 'icons'
import { CircleHelpIcon, SnowflakeIcon } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

import type { ReplicationDestinationType } from './ReplicationDiagram/Nodes.utils'

type DestinationIconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: string | number }>

const destinationIconByType: Record<ReplicationDestinationType, DestinationIconComponent> = {
  BigQuery,
  DuckLake: Database,
  Snowflake: SnowflakeIcon,
  ClickHouse,
  Unknown: CircleHelpIcon,
}

interface DestinationIconProps extends Omit<SVGProps<SVGSVGElement>, 'strokeWidth'> {
  type: ReplicationDestinationType
  size?: string | number
}

export const DestinationIcon = ({ type, ...props }: DestinationIconProps) => {
  const Icon = destinationIconByType[type]

  return <Icon {...props} strokeWidth={1.5} />
}
