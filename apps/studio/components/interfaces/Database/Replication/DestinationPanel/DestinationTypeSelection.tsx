import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DestinationIcon } from '../DestinationIcon'
import { useDestinationInformation } from '../useDestinationInformation'
import {
  useIsETLBigQueryPrivateAlpha,
  useIsETLClickHousePrivateAlpha,
  useIsETLDucklakePrivateAlpha,
  useIsETLIcebergPrivateAlpha,
  useIsETLSnowflakePrivateAlpha,
} from '../useIsETLPrivateAlpha'
import { DestinationType } from './DestinationPanel.types'
import { ReadReplicasMovedCallout } from './ReadReplicasMovedCallout'

interface DestinationTypeOption {
  value: DestinationType
  label: string
  description: string
  stage: 'Public Alpha' | 'Early Access' | 'Deprecated' | null
  enabled: boolean
}

interface DestinationTypeGroup {
  label: NonNullable<DestinationTypeOption['stage']>
  options: DestinationTypeOption[]
}

export const DestinationTypeSelection = () => {
  const etlEnableBigQuery = useIsETLBigQueryPrivateAlpha()
  const etlEnableIceberg = useIsETLIcebergPrivateAlpha()
  const etlEnableDucklake = useIsETLDucklakePrivateAlpha()
  const etlEnableSnowflake = useIsETLSnowflakePrivateAlpha()
  const etlEnableClickHouse = useIsETLClickHousePrivateAlpha()

  const [urlDestinationType, setDestinationType] = useQueryState(
    'destinationType',
    parseAsStringEnum<DestinationType>([
      'BigQuery',
      'Analytics Bucket',
      'DuckLake',
      'Snowflake',
      'ClickHouse',
    ]).withOptions({
      history: 'push',
      clearOnDefault: true,
    })
  )

  const [edit] = useQueryState(
    'edit',
    parseAsInteger.withOptions({ history: 'push', clearOnDefault: true })
  )
  const editMode = edit !== null

  const { type: existingDestinationType } = useDestinationInformation({ id: edit })
  const destinationType = existingDestinationType ?? urlDestinationType

  const isOptionVisible = (value: DestinationType, hasAccess: boolean) =>
    editMode ? destinationType === value : hasAccess

  const groups: DestinationTypeGroup[] = [
    {
      label: 'Public Alpha',
      options: [
        {
          value: 'BigQuery',
          label: 'BigQuery',
          description: "Replicate changes to Google Cloud's data warehouse for analytics and BI",
          stage: 'Public Alpha',
          enabled: isOptionVisible('BigQuery', etlEnableBigQuery),
        },
      ],
    },
    {
      label: 'Early Access',
      options: [
        {
          value: 'DuckLake',
          label: 'DuckLake',
          description: 'Replicate changes to a DuckLake catalog backed by S3-compatible storage',
          stage: 'Early Access',
          enabled: isOptionVisible('DuckLake', etlEnableDucklake),
        },
        {
          value: 'Snowflake',
          label: 'Snowflake',
          description:
            'Replicate changes to Snowflake for warehouse analytics and downstream data workflows',
          stage: 'Early Access',
          enabled: isOptionVisible('Snowflake', etlEnableSnowflake),
        },
        {
          value: 'ClickHouse',
          label: 'ClickHouse',
          description: 'Stream changes to a ClickHouse cluster for fast columnar analytics',
          stage: 'Early Access',
          enabled: isOptionVisible('ClickHouse', etlEnableClickHouse),
        },
      ],
    },
    {
      label: 'Deprecated',
      options: [
        {
          value: 'Analytics Bucket',
          label: 'Analytics Bucket',
          description: 'Write Apache Iceberg tables to Supabase Storage for analytics workflows',
          stage: 'Deprecated',
          enabled: isOptionVisible('Analytics Bucket', etlEnableIceberg),
        },
      ],
    },
  ]

  const visibleGroups = groups
    .map((group) => ({ ...group, options: group.options.filter((option) => option.enabled) }))
    .filter((group) => group.options.length > 0)
  const options = visibleGroups.flatMap((group) => group.options)

  const selectedOption = options.find((option) => option.value === destinationType)

  const STAGE_DESCRIPTIONS: Record<NonNullable<DestinationTypeOption['stage']>, string> = {
    'Public Alpha': 'In public alpha and may change.',
    'Early Access': 'In early access and may change.',
    Deprecated: 'This destination type is deprecated.',
  }

  const stageDescription = selectedOption?.stage ? STAGE_DESCRIPTIONS[selectedOption.stage] : null

  const typeDescription =
    !editMode || stageDescription ? (
      <span>
        {!editMode && 'Cannot be changed after creation.'}
        {!editMode && stageDescription ? ' ' : null}
        {stageDescription}
      </span>
    ) : undefined

  return (
    <>
      <FormItemLayout
        isReactForm={false}
        layout="horizontal"
        className="p-5 [&>div]:gap-y-1 [&>div>span]:text-foreground-lighter"
        label="Type"
        description={typeDescription}
      >
        <Select
          disabled={editMode}
          value={destinationType ?? undefined}
          onValueChange={(value) => setDestinationType(value as DestinationType)}
        >
          <SelectTrigger className="h-auto py-2">
            {selectedOption ? (
              <div className="flex items-center gap-x-3 text-left">
                <DestinationIcon
                  type={selectedOption.value}
                  size={20}
                  className="shrink-0 text-foreground-light"
                />
                <span className="text-sm text-foreground">{selectedOption.label}</span>
              </div>
            ) : (
              <span className="text-foreground-lighter">Select a destination type</span>
            )}
          </SelectTrigger>
          <SelectContent align="end">
            {visibleGroups.map((group, index) => (
              <SelectGroup key={group.label}>
                {index > 0 && <SelectSeparator />}
                <SelectLabel>{group.label}</SelectLabel>
                {group.options.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="py-2">
                    <div className="flex items-center gap-x-3">
                      <DestinationIcon
                        type={option.value}
                        size={20}
                        className="shrink-0 text-foreground-light"
                      />
                      <div className="flex flex-col gap-y-0.5">
                        <span className="text-foreground">{option.label}</span>
                        <span className="text-xs text-foreground-lighter">
                          {option.description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </FormItemLayout>
      {!editMode && <ReadReplicasMovedCallout className="px-5 pb-5" />}
    </>
  )
}
