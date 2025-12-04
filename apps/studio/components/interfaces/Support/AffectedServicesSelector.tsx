import type { UseFormReturn } from 'react-hook-form'
// End of third-party imports

import { SupportCategories } from '@supabase/shared-types/out/constants'
import { FormControl_Shadcn_, FormField_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { MultiSelectV2 } from 'ui-patterns/MultiSelectDeprecated/MultiSelectV2'
import { type ExtendedSupportCategories, SERVICE_OPTIONS } from './Support.constants'
import type { SupportFormValues } from './SupportForm.schema'

interface AffectedServicesSelectorProps {
  form: UseFormReturn<SupportFormValues>
  category: ExtendedSupportCategories
}

export const CATEGORIES_WITHOUT_AFFECTED_SERVICES: ExtendedSupportCategories[] = [
  SupportCategories.LOGIN_ISSUES,
  'Plan_upgrade',
]

export function AffectedServicesSelector({ form, category }: AffectedServicesSelectorProps) {
  if (CATEGORIES_WITHOUT_AFFECTED_SERVICES.includes(category)) return null

  return (
    <FormField_Shadcn_
      name="affectedServices"
      control={form.control}
      render={({ field }) => (
        <FormItemLayout hideMessage layout="vertical" label="Which services are affected?">
          <FormControl_Shadcn_>
            <MultiSelectV2
              options={SERVICE_OPTIONS}
              value={field.value.length === 0 ? [] : field.value?.split(', ')}
              placeholder="No particular service"
              searchPlaceholder="Search for a service"
              onChange={(services) => form.setValue('affectedServices', services.join(', '))}
            />
          </FormControl_Shadcn_>
        </FormItemLayout>
      )}
    />
  )
}
