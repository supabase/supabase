import { UseFormReturn } from 'react-hook-form'
import {
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  useWatch_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateProjectForm } from './ProjectCreation.schema'
import Panel from '@/components/ui/Panel'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { PROVIDERS } from '@/lib/constants'

const HA_SUPPORTED_PROVIDERS = ['AWS_K8S']

interface CloudProviderSelectorProps {
  form: UseFormReturn<CreateProjectForm>
}

export const CloudProviderSelector = ({ form }: CloudProviderSelectorProps) => {
  const { infraCloudProviders: validCloudProviders } = useCustomContent(['infra:cloud_providers'])
  const highAvailability = useWatch_Shadcn_({ control: form.control, name: 'highAvailability' })

  return (
    <Panel.Content>
      <FormField_Shadcn_
        control={form.control}
        name="cloudProvider"
        render={({ field }) => (
          <FormItemLayout
            label="Cloud provider"
            layout="horizontal"
            description={
              highAvailability ? (
                <p className="text-warning">
                  High availability is only supported on AWS (Revamped)
                </p>
              ) : undefined
            }
          >
            <Select_Shadcn_
              onValueChange={(value) => field.onChange(value)}
              defaultValue={field.value}
              value={field.value}
            >
              <FormControl_Shadcn_>
                <SelectTrigger_Shadcn_>
                  <SelectValue_Shadcn_ placeholder="Select a cloud provider" />
                </SelectTrigger_Shadcn_>
              </FormControl_Shadcn_>
              <SelectContent_Shadcn_>
                <SelectGroup_Shadcn_>
                  {Object.values(PROVIDERS)
                    .filter((provider) => validCloudProviders?.includes(provider.id) ?? true)
                    .map((providerObj) => {
                      const label = providerObj['name']
                      const value = providerObj['id']
                      const isDisabled = highAvailability && !HA_SUPPORTED_PROVIDERS.includes(value)
                      return (
                        <SelectItem_Shadcn_ key={value} value={value} disabled={isDisabled}>
                          {label}
                        </SelectItem_Shadcn_>
                      )
                    })}
                </SelectGroup_Shadcn_>
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </FormItemLayout>
        )}
      />
    </Panel.Content>
  )
}
