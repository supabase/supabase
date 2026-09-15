import type { UseFormReturn } from 'react-hook-form'
import {
  Badge,
  FormControl,
  FormField,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { SupportFormValues } from './SupportForm.schema'
import { getOrgSubscriptionPlan, NO_ORG_MARKER, NO_PROJECT_MARKER } from './SupportForm.utils'
// End of third-party imports

import { useOrganizationsQuery } from '@/data/organizations/organizations-query'

interface OrganizationSelectorProps {
  form: UseFormReturn<SupportFormValues>
  orgSlug: string | null
}

export function OrganizationSelector({ form, orgSlug }: OrganizationSelectorProps) {
  const { data: organizations, isSuccess: isSuccessOrganizations } = useOrganizationsQuery()
  const subscriptionPlanId = getOrgSubscriptionPlan(organizations, orgSlug)

  return (
    <FormField
      name="organizationSlug"
      control={form.control}
      render={({ field }) => {
        const { ref: _ref, ...fieldWithoutRef } = field
        return (
          <FormItemLayout hideMessage layout="vertical" label="Which organization is affected?">
            <FormControl>
              <Select
                {...fieldWithoutRef}
                disabled={!isSuccessOrganizations}
                defaultValue={field.value}
                onValueChange={(value) => {
                  const previousOrgSlug = form.getValues('organizationSlug')
                  field.onChange(value)
                  if (previousOrgSlug !== value) {
                    form.resetField('projectRef', { defaultValue: NO_PROJECT_MARKER })
                  }
                }}
              >
                <SelectTrigger className="w-full" aria-label="Select an organization">
                  <SelectValue asChild placeholder="Select an organization">
                    <div className="flex items-center gap-x-2">
                      {orgSlug === NO_ORG_MARKER ? (
                        <span>No specific organization</span>
                      ) : (
                        (organizations ?? []).find((o) => o.slug === field.value)?.name
                      )}
                      {subscriptionPlanId && <Badge variant="default">{subscriptionPlanId}</Badge>}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {organizations?.map((org) => (
                      <SelectItem key={org.slug} value={org.slug}>
                        {org.name}
                      </SelectItem>
                    ))}
                    {isSuccessOrganizations && (organizations ?? []).length === 0 && (
                      <SelectItem value={NO_ORG_MARKER}>No specific organization</SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormControl>
          </FormItemLayout>
        )
      }}
    />
  )
}
