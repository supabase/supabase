import { ReactNode } from 'react'
import { Control } from 'react-hook-form'
import { cn, FormField_Shadcn_, RadioGroupCard, RadioGroupCardItem } from 'ui'
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
          <RadioGroupCard
            value={field.value}
            onValueChange={field.onChange}
            disabled={disabled}
            className="grid md:grid-cols-3 gap-2"
          >
            <RadioGroupCardItem
              className={cn(layout !== 'flex-row-reverse' && 'w-full')}
              key="disabled"
              value="disabled"
              label={
                <span className="flex flex-col gap-1">
                  <span className="text-foreground">Disabled</span>
                  <span className="text-foreground-light text-xs">
                    No data is sent to OpenAI, responses will be generic.
                  </span>
                </span>
              }
            />
            <RadioGroupCardItem
              className={cn(layout !== 'flex-row-reverse' && 'w-full')}
              key="schema"
              value="schema"
              label={
                <span className="flex flex-col gap-1">
                  <span className="text-foreground">Schema Only</span>
                  <span className="text-foreground-light text-xs">
                    Send only your database schema to OpenAI for better responses.
                  </span>
                </span>
              }
            />
            <RadioGroupCardItem
              className={cn(layout !== 'flex-row-reverse' && 'w-full')}
              key="schema_and_data"
              value="schema_and_data"
              label={
                <span className="flex flex-col gap-1">
                  <span className="text-foreground">Schema & Data</span>
                  <span className="text-foreground-light text-xs">
                    Send schema and SQL query data for the best AI responses.
                  </span>
                </span>
              }
            />
          </RadioGroupCard>
        )}
      />
    </div>
  )

  // Conditional rendering with FormItemLayout remains the same
  return (
    <FormItemLayout
      label={label}
      description={
        <p className="my-4">
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

  return content
}
