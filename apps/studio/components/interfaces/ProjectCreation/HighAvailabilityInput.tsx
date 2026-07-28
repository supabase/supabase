import { UseFormReturn } from 'react-hook-form'
import { Badge, FormControl, FormField, Switch } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateProjectForm } from './ProjectCreation.schema'
import Panel from '@/components/ui/Panel'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'

interface HighAvailabilityInputProps {
  form: UseFormReturn<CreateProjectForm>
}

export const HighAvailabilityInput = ({ form }: HighAvailabilityInputProps) => {
  const { hasAccess } = useCheckEntitlements('instances.high_availability')

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
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItemLayout>
        )}
      />
    </Panel.Content>
  )
}
