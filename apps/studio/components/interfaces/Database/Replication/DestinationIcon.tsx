import { AnalyticsBucket, BigQuery, ClickHouse, Database } from 'icons'
import { Snowflake } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { cn } from 'ui'

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

export const DestinationTypeReadonly = ({
  type,
  className,
}: {
  type: DestinationType
  className?: string
}) => {
  return (
    <div
      className={cn(
        'flex h-9 min-w-0 items-center gap-x-2 rounded-md border bg-surface-200 px-3 text-sm',
        className
      )}
    >
      <DestinationIcon type={type} size={20} className="shrink-0 text-foreground-light" />
      <span className="min-w-0 truncate text-foreground">{type}</span>
    </div>
  )
}
