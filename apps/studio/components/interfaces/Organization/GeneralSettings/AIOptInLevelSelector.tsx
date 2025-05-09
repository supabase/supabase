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

export const AIOptInLevelSelector = ({
  control,
  disabled,
  label,
  layout = 'vertical',
}: AIOptInLevelSelectorProps) => {
  const content = (
    <div className="space-y-4">
      <FormField_Shadcn_
        control={control as any}
        name="aiOptInLevel"
        render={({ field }) => (
          <RadioGroup_Shadcn_
            value={field.value}
            onValueChange={field.onChange}
            disabled={disabled}
            className="space-y-2 mb-6"
          >
            {[
              {
                value: 'disabled',
                title: 'Disabled',
                description: 'No data is sent to OpenAI, responses will be generic.',
              },
              {
                value: 'schema',
                title: 'Schema Only',
                description: 'Send only your database schema to OpenAI for better responses.',
              },
              {
                value: 'schema_and_log',
                title: 'Schema & Logs',
                description: 'Send schema and logging data for improved AI responses.',
              },
              {
                value: 'schema_and_log_and_data',
                title: 'Schema, Logs & Data',
                description: 'Send schema, logs, and query data for the best AI responses.',
              },
            ].map((item) => (
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
        <p className="my-4 max-w-xl">
          By opting into sending anonymous data, Supabase AI can improve the answers it shows you.
          This is an organization-wide setting. Select the level of data you are comfortable
          sharing. <OptInToOpenAIToggle />.
        </p>
      }
      layout={layout}
    >
      {content}
    </FormItemLayout>
  )
}
