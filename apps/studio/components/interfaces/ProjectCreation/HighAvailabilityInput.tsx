import { useEffect, useRef } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { type CloudProvider } from 'shared-data'
import { Badge, FormControl, FormField, Switch, useWatch } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

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
  const beforeHighAvailability = useRef<{
    cloudProvider: CloudProvider | undefined
    postgresVersionSelection: string | undefined
    dbRegion: string | null
  }>({
    cloudProvider: undefined,
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

      beforeHighAvailability.current.postgresVersionSelection = getValues(
        'postgresVersionSelection'
      )
      setValue('useOrioleDb', false)

      const currentRegion = getValues('dbRegion')
      if (
        highAvailabilityRegionName !== undefined &&
        currentRegion !== highAvailabilityRegionName
      ) {
        beforeHighAvailability.current.dbRegion = currentRegion ?? null
        setValue('dbRegion', highAvailabilityRegionName)
      }
    } else {
      if (beforeHighAvailability.current.cloudProvider !== undefined) {
        setValue('cloudProvider', beforeHighAvailability.current.cloudProvider)
        beforeHighAvailability.current.cloudProvider = undefined
      }

      if (beforeHighAvailability.current.postgresVersionSelection !== undefined) {
        setValue(
          'postgresVersionSelection',
          beforeHighAvailability.current.postgresVersionSelection
        )
        beforeHighAvailability.current.postgresVersionSelection = undefined
      }

      if (beforeHighAvailability.current.dbRegion !== null) {
        setValue('dbRegion', beforeHighAvailability.current.dbRegion)
        beforeHighAvailability.current.dbRegion = null
      }
    }
  }

  // Catches the case where highAvailabilityRegionName wasn't loaded yet at the moment the
  // toggle fired above (the org's available-regions query for AWS_K8S may still be in
  // flight). The region auto-fill effect in the parent form skips dirty fields, so a
  // manually chosen region would otherwise keep showing in the trigger — force it over
  // explicitly once the HA region becomes known.
  useEffect(() => {
    if (!highAvailability || highAvailabilityRegionName === undefined) return
    const currentRegion = getValues('dbRegion')
    if (currentRegion === highAvailabilityRegionName) return
    if (beforeHighAvailability.current.dbRegion === null) {
      beforeHighAvailability.current.dbRegion = currentRegion ?? null
    }
    setValue('dbRegion', highAvailabilityRegionName)
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
