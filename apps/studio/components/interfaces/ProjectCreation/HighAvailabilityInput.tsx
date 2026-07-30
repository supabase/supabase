import { useEffect, useRef } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { type CloudProvider } from 'shared-data'
import { Badge, FormControl, FormField, Switch, useWatch } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { HIGH_AVAILABILITY_POSTGRES_VERSION } from './ProjectCreation.constants'
import { CreateProjectForm } from './ProjectCreation.schema'
import Panel from '@/components/ui/Panel'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'

interface HighAvailabilityInputProps {
  form: UseFormReturn<CreateProjectForm>
  // Derived from an org-wide regions query owned by the parent form, since fetching it
  // here would mean duplicating that query's slug/cloud-provider/instance-size context.
  highAvailabilityRegionName: string | undefined
}

export const HighAvailabilityInput = ({
  form,
  highAvailabilityRegionName,
}: HighAvailabilityInputProps) => {
  const { getValues, setValue } = form
  const { hasAccess } = useCheckEntitlements('instances.high_availability')
  const highAvailability = useWatch({ control: form.control, name: 'highAvailability' })

  // Fields to revert to when toggling off HA, so previously selected values aren't lost.
  // cloudProvider/postgresVersion are handled directly in the toggle's onChange below,
  // since both fields are disabled elsewhere in the form whenever HA is on — nothing else
  // can change them out from under this. dbRegion instead needs its own effect (below)
  // because `highAvailabilityRegionName` depends on an async query that may not have
  // resolved yet at the moment the toggle fires.
  const beforeHighAvailability = useRef<{
    cloudProvider: CloudProvider | undefined
    postgresVersion: string
    postgresVersionSelection: string | undefined
    dbRegion: string | null
  }>({
    cloudProvider: undefined,
    postgresVersion: '',
    postgresVersionSelection: undefined,
    dbRegion: null,
  })

  const handleHighAvailabilityChange = (checked: boolean) => {
    if (checked) {
      const currentCloudProvider = getValues('cloudProvider') as CloudProvider
      if (currentCloudProvider !== 'AWS_K8S') {
        beforeHighAvailability.current.cloudProvider = currentCloudProvider
        setValue('cloudProvider', 'AWS_K8S')
      }

      const currentPostgresVersion = getValues('postgresVersion')
      if (currentPostgresVersion !== HIGH_AVAILABILITY_POSTGRES_VERSION) {
        beforeHighAvailability.current.postgresVersion = currentPostgresVersion
      }
      beforeHighAvailability.current.postgresVersionSelection = getValues(
        'postgresVersionSelection'
      )
      setValue('postgresVersion', HIGH_AVAILABILITY_POSTGRES_VERSION)
      setValue('useOrioleDb', false)
    } else {
      if (beforeHighAvailability.current.cloudProvider !== undefined) {
        setValue('cloudProvider', beforeHighAvailability.current.cloudProvider)
        beforeHighAvailability.current.cloudProvider = undefined
      }

      if (getValues('postgresVersion') === HIGH_AVAILABILITY_POSTGRES_VERSION) {
        setValue('postgresVersion', beforeHighAvailability.current.postgresVersion)
      }
      if (beforeHighAvailability.current.postgresVersionSelection !== undefined) {
        setValue(
          'postgresVersionSelection',
          beforeHighAvailability.current.postgresVersionSelection
        )
        beforeHighAvailability.current.postgresVersionSelection = undefined
      }
    }
  }

  // The region auto-fill effect in the parent form skips dirty fields, so a manually
  // chosen region would keep showing in the trigger while HA only offers its fixed
  // region — force it over (and restore it afterwards) explicitly.
  useEffect(() => {
    if (highAvailability && highAvailabilityRegionName !== undefined) {
      const currentRegion = getValues('dbRegion')
      if (currentRegion !== highAvailabilityRegionName) {
        if (beforeHighAvailability.current.dbRegion === null) {
          beforeHighAvailability.current.dbRegion = currentRegion ?? null
        }
        setValue('dbRegion', highAvailabilityRegionName)
      }
    } else if (!highAvailability && beforeHighAvailability.current.dbRegion !== null) {
      setValue('dbRegion', beforeHighAvailability.current.dbRegion)
      beforeHighAvailability.current.dbRegion = null
    }
  }, [highAvailability, highAvailabilityRegionName, getValues, setValue])

  if (!hasAccess) return null

  return (
    <Panel.Content>
      <FormField
        control={form.control}
        name="highAvailability"
        render={({ field }) => (
          <FormItemLayout
            label={
              <div className="flex items-center gap-x-2">
                <span>High availability</span>
                <Badge variant="warning">Alpha</Badge>
              </div>
            }
            description="Horizontally scalable Postgres for highly available deployments. Free during Alpha for up to 2 projects."
            layout="horizontal"
          >
            <FormControl>
              <Switch
                aria-label="Enable high availability"
                checked={field.value}
                onCheckedChange={(checked) => {
                  handleHighAvailabilityChange(checked)
                  field.onChange(checked)
                }}
              />
            </FormControl>
          </FormItemLayout>
        )}
      />
    </Panel.Content>
  )
}
