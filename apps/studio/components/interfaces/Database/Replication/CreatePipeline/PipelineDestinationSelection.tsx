import { useId, type ReactNode } from 'react'
import { Badge, RadioGroupStacked, RadioGroupStackedItem } from 'ui'

export type PipelineDestinationType =
  | 'BigQuery'
  | 'DuckLake'
  | 'Snowflake'
  | 'ClickHouse'
  | 'Analytics Bucket'

const DESTINATIONS: { type: PipelineDestinationType; description: string }[] = [
  { type: 'BigQuery', description: 'Replicate changes to BigQuery for analytics and BI' },
  { type: 'DuckLake', description: 'Replicate changes to DuckLake for open lakehouse storage' },
  { type: 'Snowflake', description: 'Replicate changes to Snowflake for cloud data warehousing' },
  { type: 'ClickHouse', description: 'Replicate changes to ClickHouse for real-time analytics' },
  {
    type: 'Analytics Bucket',
    description: 'Replicate changes to Supabase Storage as Apache Iceberg tables',
  },
]

export const PipelineDestinationSelection = ({
  availableDestinations,
  value,
  onChange,
  disabled = false,
  renderLogo,
}: {
  availableDestinations: PipelineDestinationType[]
  value: PipelineDestinationType | null
  onChange: (value: PipelineDestinationType) => void
  disabled?: boolean
  renderLogo?: (type: PipelineDestinationType) => ReactNode
}) => {
  const id = useId()
  const options = DESTINATIONS.filter(({ type }) => availableDestinations.includes(type))

  if (options.length === 0)
    return <p className="text-sm text-foreground-light">No destinations are available.</p>

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Destination type</p>
      <RadioGroupStacked
        aria-label="Destination type"
        orientation="vertical"
        value={value ?? ''}
        disabled={disabled}
        onValueChange={(nextValue) => {
          const option = options.find(({ type }) => type === nextValue)
          if (option) onChange(option.type)
        }}
      >
        {options.map(({ type, description }) => (
          <RadioGroupStackedItem
            key={type}
            id={`${id}-${type.replace(/\s+/g, '-')}`}
            value={type}
            className="[&>div]:items-center [&>div]:py-3.5"
            label={
              <span className="flex items-center gap-x-3.5">
                {renderLogo?.(type)}
                <span className="flex flex-col">
                  <span className="flex items-center gap-x-2 font-medium text-foreground">
                    {type}
                    {type === 'Analytics Bucket' && <Badge variant="warning">DEPRECATED</Badge>}
                  </span>
                  <span className="text-sm text-foreground-lighter text-balance">
                    {description}
                  </span>
                </span>
              </span>
            }
          />
        ))}
      </RadioGroupStacked>
    </div>
  )
}
