import Link from 'next/link'
import { UseFormReturn } from 'react-hook-form'
import { FormControl_Shadcn_, FormField_Shadcn_, Switch } from 'ui'
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
      <FormField_Shadcn_
        control={form.control}
        name="highAvailability"
        render={({ field }) => (
          <FormItemLayout
            label="High Availability"
            description={
              <>
                Powered by{' '}
                <Link href="https://multigres.com/" target="_blank" className="text-link">
                  Multigres
                </Link>
                : horizontally scalable Postgres for multi-tenant, highly available, globally
                distributed deployments while staying true to standard Postgres.
              </>
            }
            layout="horizontal"
          >
            <FormControl_Shadcn_>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />
    </Panel.Content>
  )
}
