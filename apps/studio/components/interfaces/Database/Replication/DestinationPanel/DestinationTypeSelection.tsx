import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs'
import {
  Badge,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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

const STAGE_BADGE_VARIANT: Record<
  NonNullable<DestinationTypeOption['stage']>,
  'warning' | 'destructive' | 'default'
> = {
  'Early Access': 'warning',
  Deprecated: 'destructive',
  'Public Alpha': 'default',
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

  const options: DestinationTypeOption[] = (
    [
      {
        value: 'Analytics Bucket',
        label: 'Analytics Bucket',
        description: 'Write Apache Iceberg tables to Supabase Storage for analytics workflows',
        stage: 'Deprecated',
        enabled: isOptionVisible('Analytics Bucket', etlEnableIceberg),
      },
      {
        value: 'BigQuery',
        label: 'BigQuery',
        description: "Replicate changes to Google Cloud's data warehouse for analytics and BI",
        stage: 'Public Alpha',
        enabled: isOptionVisible('BigQuery', etlEnableBigQuery),
      },
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
    ] satisfies DestinationTypeOption[]
  ).filter((option) => option.enabled)

  const selectedOption = options.find((option) => option.value === destinationType)

  const stageDescription =
    selectedOption?.stage === 'Public Alpha'
      ? 'In public alpha and may change.'
      : selectedOption?.stage === 'Early Access'
        ? 'In early access and may change.'
        : selectedOption?.stage === 'Deprecated'
          ? 'This destination type is deprecated.'
          : null

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
                <div className="flex items-center gap-x-2">
                  <span className="text-sm text-foreground">{selectedOption.label}</span>
                  {selectedOption.stage && (
                    <Badge variant={STAGE_BADGE_VARIANT[selectedOption.stage]}>
                      {selectedOption.stage}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-foreground-lighter">Select a destination type</span>
            )}
          </SelectTrigger>
          <SelectContent align="end">
            {options.length > 0 && (
              <SelectGroup>
                <SelectLabel>Pipelines</SelectLabel>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="py-2">
                    <div className="flex items-center gap-x-3">
                      <DestinationIcon
                        type={option.value}
                        size={20}
                        className="shrink-0 text-foreground-light"
                      />
                      <div className="flex flex-col gap-y-0.5">
                        <div className="flex items-center gap-x-2">
                          <span className="text-foreground">{option.label}</span>
                          {option.stage && (
                            <Badge variant={STAGE_BADGE_VARIANT[option.stage]}>
                              {option.stage}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-foreground-lighter">
                          {option.description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
      </FormItemLayout>
      {!editMode && <ReadReplicasMovedCallout className="px-5 pb-5" />}
    </>
  )
}
