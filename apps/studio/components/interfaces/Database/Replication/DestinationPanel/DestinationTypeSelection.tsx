import { AnalyticsBucket, BigQuery, Database } from 'icons'
import { Snowflake } from 'lucide-react'
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs'
import {
  Badge,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { useDestinationInformation } from '../useDestinationInformation'
import {
  useIsETLBigQueryPrivateAlpha,
  useIsETLDucklakePrivateAlpha,
  useIsETLIcebergPrivateAlpha,
  useIsETLSnowflakePrivateAlpha,
} from '../useIsETLPrivateAlpha'
import { DestinationType } from './DestinationPanel.types'
import { InlineLink } from '@/components/ui/InlineLink'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

interface DestinationTypeOption {
  value: DestinationType
  label: string
  description: string
  icon: typeof Database
  isAlpha: boolean
  enabled: boolean
}

interface DestinationTypeGroup {
  label: string
  options: DestinationTypeOption[]
}

export const DestinationTypeSelection = () => {
  const etlEnableBigQuery = useIsETLBigQueryPrivateAlpha()
  const etlEnableIceberg = useIsETLIcebergPrivateAlpha()
  const etlEnableDucklake = useIsETLDucklakePrivateAlpha()
  const etlEnableSnowflake = useIsETLSnowflakePrivateAlpha()
  const { infrastructureReadReplicas } = useIsFeatureEnabled(['infrastructure:read_replicas'])

  const [urlDestinationType, setDestinationType] = useQueryState(
    'destinationType',
    parseAsStringEnum<DestinationType>([
      'Read Replica',
      'BigQuery',
      'Analytics Bucket',
      'DuckLake',
      'Snowflake',
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

  // In edit mode the type is locked, so only surface the option that matches the
  // destination being edited. Otherwise show every type the project has access to.
  const isOptionVisible = (value: DestinationType, hasAccess: boolean) =>
    editMode ? destinationType === value : hasAccess

  const groups: DestinationTypeGroup[] = [
    {
      label: 'Other',
      options: [
        {
          value: 'Read Replica',
          label: 'Read Replica',
          description:
            'Deploy a read-only database in another region for lower latency and workload isolation',
          icon: Database,
          isAlpha: false,
          enabled: isOptionVisible('Read Replica', infrastructureReadReplicas),
        },
      ],
    },
    {
      label: 'Pipelines',
      options: [
        {
          value: 'Analytics Bucket',
          label: 'Analytics Bucket',
          description: 'Write Apache Iceberg tables to Supabase Storage for analytics workflows',
          icon: AnalyticsBucket,
          isAlpha: true,
          enabled: isOptionVisible('Analytics Bucket', etlEnableIceberg),
        },
        {
          value: 'BigQuery',
          label: 'BigQuery',
          description: "Stream changes to Google Cloud's data warehouse for analytics and BI",
          icon: BigQuery,
          isAlpha: true,
          enabled: isOptionVisible('BigQuery', etlEnableBigQuery),
        },
        {
          value: 'DuckLake',
          label: 'DuckLake',
          description: 'Stream changes to a DuckLake catalog backed by S3-compatible storage',
          icon: Database,
          isAlpha: true,
          enabled: isOptionVisible('DuckLake', etlEnableDucklake),
        },
        {
          value: 'Snowflake',
          label: 'Snowflake',
          description:
            'Stream changes to Snowflake for warehouse analytics and downstream data workflows',
          icon: Snowflake,
          isAlpha: true,
          enabled: isOptionVisible('Snowflake', etlEnableSnowflake),
        },
      ],
    },
  ]

  const visibleGroups = groups
    .map((group) => ({ ...group, options: group.options.filter((option) => option.enabled) }))
    .filter((group) => group.options.length > 0)

  const selectedOption = visibleGroups
    .flatMap((group) => group.options)
    .find((option) => option.value === destinationType)

  return (
    <FormItemLayout
      isReactForm={false}
      layout="horizontal"
      className="p-5 [&>div]:gap-y-1 [&>div>span]:text-foreground-lighter"
      label="Type"
      labelOptional="Destination type cannot be changed after creation"
      description={
        selectedOption?.isAlpha && (
          <span className="block text-sm text-foreground-light mb-1">
            This destination type is in alpha and may be unstable or introduce breaking changes
            while we iterate based on customer feedback.{' '}
            <InlineLink href="https://github.com/orgs/supabase/discussions/39416">
              Leave feedback
            </InlineLink>
          </span>
        )
      }
    >
      <Select
        disabled={editMode}
        value={destinationType ?? undefined}
        onValueChange={(value) => setDestinationType(value as DestinationType)}
      >
        <SelectTrigger className="h-auto py-2">
          {selectedOption ? (
            <div className="flex items-center gap-x-3 text-left">
              <selectedOption.icon size={20} className="shrink-0 text-foreground-light" />
              <div className="flex items-center gap-x-2">
                <span className="text-sm text-foreground">{selectedOption.label}</span>
                {selectedOption.isAlpha && <Badge variant="warning">Alpha</Badge>}
              </div>
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
                    <option.icon size={20} className="shrink-0 text-foreground-light" />
                    <div className="flex flex-col gap-y-0.5">
                      <div className="flex items-center gap-x-2">
                        <span className="text-foreground">{option.label}</span>
                        {option.isAlpha && <Badge variant="warning">Alpha</Badge>}
                      </div>
                      <span className="text-xs text-foreground-lighter">{option.description}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </FormItemLayout>
  )
}
