import { ReactNode } from 'react'
import { Control } from 'react-hook-form'
import { cn, FormField_Shadcn_, RadioGroup_Shadcn_, RadioGroupItem_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import OptInToOpenAIToggle from './OptInToOpenAIToggle'
import { AIOptInFormValues } from 'hooks/forms/useAIOptInForm'

interface AIOptInLevelSelectorProps {
  control: Control<AIOptInFormValues>
  disabled?: boolean
  label?: ReactNode
  layout?: 'horizontal' | 'vertical' | 'flex-row-reverse'
}

const AI_OPT_IN_LEVELS = [
  {
    value: 'disabled',
    title: 'Disabled',
    description: 'Responses will be generic',
  },
  {
    value: 'schema',
    title: 'Schema Only',
    description: 'We will only ever send your database schema to Bedrock',
  },
  {
    value: 'schema_and_log',
    title: 'Schema & Logs',
    description:
      'Schema and logs (may contain PII/database data) will be sent to Bedrock for better results',
  },
  {
    value: 'schema_and_log_and_data',
    title: 'Schema, Logs & Database Data',
    description: 'Give Bedrock full access to run database read only queries and analyze results',
  },
]

export const AIOptInLevelSelector = ({
  control,
  disabled,
  label,
  layout = 'vertical',
}: AIOptInLevelSelectorProps) => {
  const content = (
    <div>
      <FormField_Shadcn_
        control={control}
        name="aiOptInLevel"
        render={({ field }) => (
          <RadioGroup_Shadcn_
            value={field.value}
            onValueChange={field.onChange}
            disabled={disabled}
            className="space-y-2 mb-6"
          >
            {AI_OPT_IN_LEVELS.map((item) => (
              <div key={item.value} className="flex items-start space-x-3">
                <RadioGroupItem_Shadcn_
                  value={item.value}
                  id={`ai-opt-in-${item.value}`}
                  className="mt-0.5"
                />
                <label htmlFor={`ai-opt-in-${item.value}`} className="cursor-pointer flex flex-col">
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                  <span className="text-sm text-foreground-light">{item.description}</span>
                </label>
              </div>
            ))}
          </RadioGroup_Shadcn_>
        )}
      />
    </div>
  )

  return (
    <FormItemLayout
      label={label}
      description={
        <div className="space-y-4 my-4 max-w-xl space-y-4">
          <p>
            Supabase AI can provide more relevant answers if you choose to share different levels of
            data. This feature is powered by Amazon Bedrock which does not store or log your prompts
            and completions, nor does it use them to train AWS models or distribute them to third
            parties. This is an organization-wide setting, so please select the level of data you
            are comfortable sharing.
          </p>
          <p>
            <OptInToOpenAIToggle />
          </p>
        </div>
      }
      layout={layout}
    >
      {content}
    </FormItemLayout>
  )
}
