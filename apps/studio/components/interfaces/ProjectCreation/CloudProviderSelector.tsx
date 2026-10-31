import { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useWatch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateProjectForm } from './ProjectCreation.schema'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { PROVIDERS } from '@/lib/constants'

const HA_SUPPORTED_PROVIDERS = ['AWS_K8S']

interface CloudProviderSelectorProps {
  form: UseFormReturn<CreateProjectForm>
}

export const CloudProviderSelector = ({ form }: CloudProviderSelectorProps) => {
  const { infraCloudProviders: validCloudProviders } = useCustomContent(['infra:cloud_providers'])
  const highAvailability = useWatch({ control: form.control, name: 'highAvailability' })

  return (
    <FormField
      control={form.control}
      name="cloudProvider"
      render={({ field }) => (
        <FormItemLayout
          label="Cloud provider"
          layout="horizontal"
          description={
            highAvailability ? (
              <p className="text-warning">High availability is only supported on AWS (Revamped)</p>
            ) : (
              'Select which cloud provider to spin up project from'
            )
          }
        >
          <Select
            onValueChange={(value) => field.onChange(value)}
            defaultValue={field.value}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a cloud provider" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectGroup>
                {Object.values(PROVIDERS)
                  .filter((provider) => validCloudProviders?.includes(provider.id) ?? true)
                  .map((providerObj) => {
                    const label = providerObj['name']
                    const value = providerObj['id']
                    const isDisabled = highAvailability && !HA_SUPPORTED_PROVIDERS.includes(value)
                    return (
                      <SelectItem key={value} value={value} disabled={isDisabled}>
                        {label}
                      </SelectItem>
                    )
                  })}
              </SelectGroup>
            </SelectContent>
          </Select>
        </FormItemLayout>
      )}
    />
  )
}
