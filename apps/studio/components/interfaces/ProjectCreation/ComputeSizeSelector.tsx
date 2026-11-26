import { useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { CloudProvider } from 'shared-data'
import {
  cn,
  FormField,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useWatch,
} from 'ui'
import { ComputeBadge } from 'ui-patterns/ComputeBadge'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { HIGH_AVAILABILITY_INSTANCE_SIZE, sizes } from './ProjectCreation.constants'
import { CreateProjectForm } from './ProjectCreation.schema'
import { HourlyBillingPanel } from '@/components/interfaces/Organization/BillingSettings/Subscription/HourlyBillingPanel'
import { InlineLink } from '@/components/ui/InlineLink'
import Panel from '@/components/ui/Panel'
import { instanceSizeSpecs } from '@/data/projects/new-project.constants'
import { DOCS_URL } from '@/lib/constants'

interface ComputeSizeSelectorProps {
  form: UseFormReturn<CreateProjectForm>
}

export const ComputeSizeSelector = ({ form }: ComputeSizeSelectorProps) => {
  const cloudProvider = useWatch({ control: form.control, name: 'cloudProvider' }) as CloudProvider
  const highAvailability = useWatch({ control: form.control, name: 'highAvailability' })

  const sizeOptions = useMemo(
    () =>
      highAvailability
        ? [HIGH_AVAILABILITY_INSTANCE_SIZE]
        : sizes.filter((option) =>
            instanceSizeSpecs[option].cloud_providers.includes(cloudProvider)
          ),
    [highAvailability, cloudProvider]
  )

  return (
    <Panel.Content>
      <FormField
        control={form.control}
        name="instanceSize"
        render={({ field }) => {
          const selectedSize = sizeOptions.find((option) => option === field.value)
          const selectedSpecs = selectedSize ? instanceSizeSpecs[selectedSize] : undefined

          return (
            <FormItemLayout id="instanceSize" layout="horizontal" label="Compute size">
              <Select
                value={field.value}
                onValueChange={(value) => value !== '' && field.onChange(value)}
              >
                <SelectTrigger
                  id="instanceSize"
                  className="[&>span>div>div>[data-field=instance-details]]:hidden"
                >
                  <SelectValue placeholder="Select a compute size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {sizeOptions.map((option) => {
                      return (
                        <SelectItem key={option} value={option}>
                          <div className="flex flex-row gap-4 items-center">
                            <div className="w-14 flex items-center">
                              <ComputeBadge infraComputeSize={option} />
                            </div>

                            <div className="text-sm">
                              <span className="text-foreground">
                                {instanceSizeSpecs[option].ram} RAM /{' '}
                                {instanceSizeSpecs[option].cpu}
                              </span>
                              <p
                                translate="no"
                                className={cn(
                                  'text-xs',
                                  highAvailability
                                    ? 'line-through text-foreground-lighter'
                                    : 'text-foreground-light'
                                )}
                                data-field="instance-details"
                              >
                                ${instanceSizeSpecs[option].priceHourly}/hour (~$
                                {instanceSizeSpecs[option].priceMonthly}/month)
                              </p>
                              {highAvailability && (
                                <p
                                  className="text-xs text-foreground-light"
                                  data-field="instance-details"
                                >
                                  Free during Alpha
                                </p>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                    {!highAvailability && (
                      <SelectItem key={'disabled'} value={'disabled'} disabled>
                        <div className="flex items-center justify-center w-full">
                          <span>Larger, dedicated compute available after creation</span>
                        </div>
                      </SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {!highAvailability && selectedSpecs && (
                <div className="mt-3">
                  <HourlyBillingPanel
                    perProjectMonthlyPrice={selectedSpecs.priceMonthly}
                    hourlyRate={selectedSpecs.priceHourly}
                  />
                </div>
              )}
            </FormItemLayout>
          )
        }}
      />
    </Panel.Content>
  )
}
