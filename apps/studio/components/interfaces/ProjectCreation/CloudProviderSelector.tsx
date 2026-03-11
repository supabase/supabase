import { UseFormReturn } from 'react-hook-form'

import Panel from 'components/ui/Panel'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { PROVIDERS } from 'lib/constants'
import {
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { CreateProjectForm } from './ProjectCreation.schema'

interface CloudProviderSelectorProps {
  form: UseFormReturn<CreateProjectForm>
}

export const CloudProviderSelector = ({ form }: CloudProviderSelectorProps) => {
  const { infraCloudProviders: validCloudProviders } = useCustomContent(['infra:cloud_providers'])

  return (
    <Panel.Content>
      <FormField_Shadcn_
        control={form.control}
        name="cloudProvider"
        render={({ field }) => (
          <FormItemLayout label="Cloud provider" layout="horizontal">
            <Select_Shadcn_
              onValueChange={(value) => field.onChange(value)}
              defaultValue={field.value}
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
                      return (
                        <SelectItem_Shadcn_ key={value} value={value}>
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
