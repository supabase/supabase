// End of third-party imports

import { SupportCategories } from '@supabase/shared-types/out/constants'
import type { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { MultiSelectV2 } from 'ui-patterns/MultiSelectDeprecated/MultiSelectV2'

import { SERVICE_OPTIONS, type ExtendedSupportCategories } from './Support.constants'
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
    <FormField
      name="affectedServices"
      control={form.control}
      render={({ field }) => (
        <FormItemLayout hideMessage layout="vertical" label="Which services are affected?">
          <FormControl>
            <MultiSelectV2
              options={SERVICE_OPTIONS}
              value={field.value.length === 0 ? [] : field.value?.split(', ')}
              placeholder="No particular service"
              searchPlaceholder="Search for a service"
              onChange={(services) => form.setValue('affectedServices', services.join(', '))}
            />
          </FormControl>
        </FormItemLayout>
      )}
    />
  )
}
