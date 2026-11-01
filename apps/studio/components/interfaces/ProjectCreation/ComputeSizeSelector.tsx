import { UseFormReturn } from 'react-hook-form'
import {
  cn,
  FormField,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { ComputeBadge } from 'ui-patterns/ComputeBadge'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateProjectForm } from './ProjectCreation.schema'
import { InlineLink } from '@/components/ui/InlineLink'
import Panel from '@/components/ui/Panel'
import { DesiredInstanceSize, instanceSizeSpecs } from '@/data/projects/new-project.constants'
import { DOCS_URL } from '@/lib/constants'

interface ComputeSizeSelectorProps {
  form: UseFormReturn<CreateProjectForm>
  sizeOptions: DesiredInstanceSize[]
  highAvailability: boolean
}

export const ComputeSizeSelector = ({
  form,
  sizeOptions,
  highAvailability,
}: ComputeSizeSelectorProps) => {
  return (
    <Panel.Content>
      <FormField
        control={form.control}
        name="instanceSize"
        render={({ field }) => (
          <FormItemLayout
            id="instanceSize"
            layout="horizontal"
            label="Compute size"
            description={
              <p>
                The size for your dedicated database. You can change this later. Learn more about{' '}
                <InlineLink href={`${DOCS_URL}/guides/platform/compute-add-ons`}>
                  compute add-ons
                </InlineLink>{' '}
                and{' '}
                <InlineLink href={`${DOCS_URL}/guides/platform/manage-your-usage/compute`}>
                  compute billing
                </InlineLink>
                .
              </p>
            }
          >
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
                              {instanceSizeSpecs[option].ram} RAM / {instanceSizeSpecs[option].cpu}
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
                              {instanceSizeSpecs[option].priceHourly === null
                                ? 'Pricing Info N/A'
                                : `$${instanceSizeSpecs[option].priceHourly}/hour (~$${instanceSizeSpecs[option].priceMonthly}/month)`}
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
          </FormItemLayout>
        )}
      />
    </Panel.Content>
  )
}
