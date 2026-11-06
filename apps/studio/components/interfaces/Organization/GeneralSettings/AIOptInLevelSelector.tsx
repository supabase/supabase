import { ReactNode } from 'react'
import { Control } from 'react-hook-form'
import { Badge, cn, FormField, RadioGroup, RadioGroupItem } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { OptInToOpenAIToggle } from './OptInToOpenAIToggle'
import { InlineLink } from '@/components/ui/InlineLink'
import { AIOptInFormValues } from '@/hooks/forms/useAIOptInForm'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { DOCS_URL } from '@/lib/constants'

interface AIOptInLevelSelectorProps {
  control: Control<AIOptInFormValues>
  disabled?: boolean
  label?: ReactNode
  layout?: 'horizontal' | 'vertical' | 'flex-row-reverse'
  /** Badge the saved and proposed levels. */
  currentLevel?: AiOptInLevel
  proposedLevel?: AiOptInLevel
}

export const AIOptInLevelSelector = ({
  control,
  disabled,
  label,
  layout = 'vertical',
  currentLevel,
  proposedLevel,
}: AIOptInLevelSelectorProps) => {
  const {
    aiOptInLevelDisabled,
    aiOptInLevelSchema,
    aiOptInLevelSchemaAndLog,
    aiOptInLevelSchemaAndLogAndData,
  } = useIsFeatureEnabled([
    'ai:opt_in_level_disabled',
    'ai:opt_in_level_schema',
    'ai:opt_in_level_schema_and_log',
    'ai:opt_in_level_schema_and_log_and_data',
  ])

  const AI_OPT_IN_LEVELS = [
    ...(aiOptInLevelDisabled
      ? [
          {
            value: 'disabled',
            title: 'Disabled',
            description:
              'You do not consent to sharing any database information with third-party AI providers and understand that responses will be generic and not tailored to your database',
          },
        ]
      : []),
    ...(aiOptInLevelSchema
      ? [
          {
            value: 'schema',
            title: 'Schema Only',
            description:
              'You consent to sharing your database’s schema metadata (such as table and column names, data types, and relationships—but not actual database data) with third-party AI providers',
          },
        ]
      : []),
    ...(aiOptInLevelSchemaAndLog
      ? [
          {
            value: 'schema_and_log',
            title: 'Schema & Logs',
            description:
              'You consent to sharing your schema and logs (which may contain PII/database data) with third-party AI providers for better results',
          },
        ]
      : []),
    ...(aiOptInLevelSchemaAndLogAndData
      ? [
          {
            value: 'schema_and_log_and_data',
            title: 'Schema, Logs & Database Data',
            description:
              'You consent to give third-party AI providers full access to run database read-only queries and analyze results for optimal results',
          },
        ]
      : []),
  ]

  const isComparing = currentLevel !== undefined || proposedLevel !== undefined

  return (
    <FormItemLayout
      label={label}
      layout={layout}
      description={
        <div className="flex flex-col gap-y-4 my-4 max-w-xl">
          <p>
            Supabase AI can provide more relevant answers if you choose to share different levels of
            data. This feature is powered by third-party AI providers. This is an organization-wide
            setting, so please select the level of data you are comfortable sharing.
          </p>
          <p>
            For organizations with HIPAA compliance enabled in their Supabase configuration, any
            consented information will only be shared with third-party AI providers with whom
            Supabase has established a Business Associate Agreement (BAA). Don't input personal data
            unless you've{' '}
            <InlineLink href={`${DOCS_URL}/guides/deployment/shared-responsibility-model`}>
              obtained consent
            </InlineLink>{' '}
            from the individuals it relates to.
          </p>
          <OptInToOpenAIToggle />
        </div>
      }
    >
      <div className="max-w-xl">
        <FormField
          control={control}
          name="aiOptInLevel"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
              className="space-y-2 mb-6"
            >
              {AI_OPT_IN_LEVELS.map((item) => (
                <div
                  key={item.value}
                  className={cn(
                    'flex items-start space-x-3',
                    isComparing && '-mx-3 rounded-md border border-transparent p-3',
                    item.value === proposedLevel && 'border-brand-500/40 bg-brand-default/5'
                  )}
                >
                  <RadioGroupItem
                    value={item.value}
                    id={`ai-opt-in-${item.value}`}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`ai-opt-in-${item.value}`}
                    className="cursor-pointer flex flex-col"
                  >
                    <span className="flex items-center gap-x-2 text-sm font-medium text-foreground">
                      {item.title}
                      {item.value === currentLevel && <Badge variant="warning">Current</Badge>}
                      {item.value === proposedLevel && <Badge variant="success">Proposed</Badge>}
                    </span>
                    <span className="text-sm text-foreground-light">{item.description}</span>
                  </label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
      </div>
    </FormItemLayout>
  )
}
