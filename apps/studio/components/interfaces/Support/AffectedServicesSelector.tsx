// End of third-party imports

import { SupportCategories } from '@supabase/shared-types/out/constants'
import type { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

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
            <MultiSelector
              values={field.value.length === 0 ? [] : field.value?.split(', ')}
              onValuesChange={(services) => field.onChange(services.join(', '))}
            >
              <MultiSelectorTrigger
                mode="inline-combobox"
                label={field.value.length === 0 ? 'No particular service' : 'Search for a service'}
                deletableBadge
                badgeLimit="wrap"
                showIcon={false}
              />
              <MultiSelectorContent>
                <MultiSelectorList>
                  {SERVICE_OPTIONS.map((service) => (
                    <MultiSelectorItem
                      key={service.id}
                      value={service.value}
                      disabled={service.disabled}
                    >
                      {service.name}
                    </MultiSelectorItem>
                  ))}
                </MultiSelectorList>
              </MultiSelectorContent>
            </MultiSelector>
          </FormControl>
        </FormItemLayout>
      )}
    />
  )
}
