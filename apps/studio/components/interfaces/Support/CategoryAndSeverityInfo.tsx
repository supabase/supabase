import type { UseFormReturn } from 'react-hook-form'
// End of third-party imports

import { SupportCategories } from '@supabase/shared-types/out/constants'
import { InlineLink } from 'components/ui/InlineLink'
import {
  cn,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  CATEGORY_OPTIONS,
  type ExtendedSupportCategories,
  SEVERITY_OPTIONS,
} from './Support.constants'
import type { SupportFormValues } from './SupportForm.schema'

interface CategoryAndSeverityInfoProps {
  form: UseFormReturn<SupportFormValues>
  category: ExtendedSupportCategories
  severity: string
  projectRef: string
}

export function CategoryAndSeverityInfo({
  form,
  category,
  severity,
  projectRef,
}: CategoryAndSeverityInfoProps) {
  return (
    <div className={cn('grid sm:grid-cols-2 sm:grid-rows-1 gap-4 grid-cols-1 grid-rows-2')}>
      <CategorySelector form={form} />
      <SeveritySelector form={form} />

      <IssueSuggestion category={category} projectRef={projectRef} />

      {(severity === 'Urgent' || severity === 'High') && (
        <Admonition
          type="default"
          className="mb-0 sm:col-span-2"
          title="We do our best to respond to everyone as quickly as possible"
          description="Prioritization will be based on production status. We ask that you reserve High and Urgent severity for production-impacting issues only."
        />
      )}
    </div>
  )
}

interface CategorySelectorProps {
  form: UseFormReturn<SupportFormValues>
}

function CategorySelector({ form }: CategorySelectorProps) {
  return (
    <FormField_Shadcn_
      name="category"
      control={form.control}
      render={({ field }) => {
        const { ref: _ref, ...fieldWithoutRef } = field
        return (
          <FormItemLayout hideMessage layout="vertical" label="What are you having issues with?">
            <FormControl_Shadcn_>
              <Select_Shadcn_
                {...fieldWithoutRef}
                defaultValue={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger_Shadcn_ aria-label="Select an issue" className="w-full">
                  <SelectValue_Shadcn_ placeholder="Select an issue">
                    {field.value
                      ? CATEGORY_OPTIONS.find((o) => o.value === field.value)?.label
                      : null}
                  </SelectValue_Shadcn_>
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectGroup_Shadcn_>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem_Shadcn_ key={option.value} value={option.value}>
                        {option.label}
                        <span className="block text-xs text-foreground-lighter">
                          {option.description}
                        </span>
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectGroup_Shadcn_>
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </FormControl_Shadcn_>
          </FormItemLayout>
        )
      }}
    />
  )
}

interface SeveritySelectorProps {
  form: UseFormReturn<SupportFormValues>
}

function SeveritySelector({ form }: SeveritySelectorProps) {
  return (
    <FormField_Shadcn_
      name="severity"
      control={form.control}
      render={({ field }) => {
        const { ref, ...fieldWithoutRef } = field
        return (
          <FormItemLayout hideMessage layout="vertical" label="Severity">
            <FormControl_Shadcn_>
              <Select_Shadcn_
                {...fieldWithoutRef}
                defaultValue={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger_Shadcn_ aria-label="Select a severity" className="w-full">
                  <SelectValue_Shadcn_ placeholder="Select a severity">
                    {field.value}
                  </SelectValue_Shadcn_>
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectGroup_Shadcn_>
                    {SEVERITY_OPTIONS.map((option) => (
                      <SelectItem_Shadcn_ key={option.value} value={option.value}>
                        {option.label}
                        <span className="block text-xs text-foreground-lighter">
                          {option.description}
                        </span>
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectGroup_Shadcn_>
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </FormControl_Shadcn_>
          </FormItemLayout>
        )
      }}
    />
  )
}

const IssueSuggestion = ({ category, projectRef }: { category: string; projectRef?: string }) => {
  const baseUrl = `/project/${projectRef === 'no-project' ? '_' : projectRef}`

  const className = 'col-span-2 mb-0'

  if (category === SupportCategories.PROBLEM) {
    return (
      <Admonition
        type="default"
        className={className}
        title="Have you checked your project's logs?"
      >
        Logs can help you identify errors that you might be running into when using your project's
        API or client libraries. View logs for each product{' '}
        <InlineLink href={`${baseUrl}/logs/edge-logs`}>here</InlineLink>.
      </Admonition>
    )
  }

  if (category === SupportCategories.DATABASE_UNRESPONSIVE) {
    return (
      <Admonition
        type="default"
        className={className}
        title="Have you checked your project's infrastructure activity?"
      >
        High memory or low disk IO bandwidth may be slowing down your database. Verify by checking
        the infrastructure activity of your project{' '}
        <InlineLink href={`${baseUrl}/settings/infrastructure#infrastructure-activity`}>
          here
        </InlineLink>
        .
      </Admonition>
    )
  }

  if (category === SupportCategories.PERFORMANCE_ISSUES) {
    return (
      <Admonition
        type="default"
        className={className}
        title="Have you checked the Query Performance Advisor?"
      >
        Identify slow running queries and get actionable insights on how to optimize them with the
        Query Performance Advisor{' '}
        <InlineLink href={`${baseUrl}/settings/infrastructure#infrastructure-activity`}>
          here
        </InlineLink>
        .
      </Admonition>
    )
  }

  return null
}
