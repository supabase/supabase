import { AnalyticsBucket, BigQuery, ClickHouse, Database } from 'icons'
import { Snowflake } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

import type { DestinationType } from './DestinationPanel/DestinationPanel.types'

type DestinationIconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: string | number }>

const destinationIconByType: Record<DestinationType, DestinationIconComponent> = {
  BigQuery,
  'Analytics Bucket': AnalyticsBucket,
  DuckLake: Database,
  Snowflake,
  ClickHouse,
}

interface DestinationIconProps extends Omit<SVGProps<SVGSVGElement>, 'strokeWidth'> {
  type: DestinationType
  size?: string | number
}

export const DestinationIcon = ({ type, ...props }: DestinationIconProps) => {
  const Icon = destinationIconByType[type]

  return <Icon {...props} strokeWidth={1.5} />
}
