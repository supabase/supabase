import { UseFormReturn } from 'react-hook-form'

import { InlineLink } from 'components/ui/InlineLink'
import Panel from 'components/ui/Panel'
import { instanceSizeSpecs } from 'data/projects/new-project.constants'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import { DOCS_URL } from 'lib/constants'
import { CloudProvider } from 'shared-data'
import {
  FormField_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { ComputeBadge } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { sizes } from './ProjectCreation.constants'
import { CreateProjectForm } from './ProjectCreation.schema'

interface ComputeSizeSelectorProps {
  form: UseFormReturn<CreateProjectForm>
}

export const ComputeSizeSelector = ({ form }: ComputeSizeSelectorProps) => {
  return (
    <Panel.Content>
      <FormField_Shadcn_
        control={form.control}
        name="instanceSize"
        render={({ field }) => (
          <FormItemLayout
            layout="horizontal"
            label="Compute size"
            description={
              <>
                <p>
                  The size for your dedicated database. You can change this later. Learn more about{' '}
                  <InlineLink
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-inherit hover:text-foreground transition-colors"
                    href={`${DOCS_URL}/guides/platform/compute-add-ons`}
                  >
                    compute add-ons
                  </InlineLink>{' '}
                  and{' '}
                  <InlineLink
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-inherit hover:text-foreground transition-colors"
                    href={`${DOCS_URL}/guides/platform/manage-your-usage/compute`}
                  >
                    compute billing
                  </InlineLink>
                  .
                </p>
              </>
            }
          >
            <Select_Shadcn_ value={field.value} onValueChange={(value) => field.onChange(value)}>
              <SelectTrigger_Shadcn_ className="[&>span>div>div>[data-field=instance-details]]:hidden">
                <SelectValue_Shadcn_ placeholder="Select a compute size" />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                <SelectGroup_Shadcn_>
                  {sizes
                    .filter((option) =>
                      instanceSizeSpecs[option].cloud_providers.includes(
                        form.getValues('cloudProvider') as CloudProvider
                      )
                    )
                    .map((option) => {
                      return (
                        <SelectItem_Shadcn_ key={option} value={option}>
                          <div className="flex flex-row gap-4 items-center">
                            <div className="w-14 flex items-center">
                              <ComputeBadge infraComputeSize={option} />
                            </div>

                            <div className="text-sm">
                              <span className="text-foreground">
                                {instanceSizeSpecs[option].ram} RAM /{' '}
                                {instanceSizeSpecs[option].cpu}{' '}
                                {getCloudProviderArchitecture(
                                  form.getValues('cloudProvider') as CloudProvider
                                )}{' '}
                                CPU
                              </span>
                              <p
                                translate="no"
                                className="text-xs text-foreground-light"
                                data-field="instance-details"
                              >
                                ${instanceSizeSpecs[option].priceHourly}/hour (~$
                                {instanceSizeSpecs[option].priceMonthly}/month)
                              </p>
                            </div>
                          </div>
                        </SelectItem_Shadcn_>
                      )
                    })}
                  <SelectItem_Shadcn_ key={'disabled'} value={'disabled'} disabled>
                    <div className="flex items-center justify-center w-full">
                      <span>Larger instance sizes available after creation</span>
                    </div>
                  </SelectItem_Shadcn_>
                </SelectGroup_Shadcn_>
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </FormItemLayout>
        )}
      />
    </Panel.Content>
  )
}
