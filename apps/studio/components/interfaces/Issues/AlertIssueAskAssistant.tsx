import { zodResolver } from '@hookform/resolvers/zod'
import { SparklesIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  cn,
  Form,
  FormControl,
  FormField,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Textarea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import type { AssistantContext } from './AlertIssueAssistant.utils'
import { useAlertIssueAssistant } from './AlertIssueAssistantProvider'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

const QUICK_ACTIONS = ['Explain this', 'Investigate further'] as const

const FormSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, 'Ask a question first')
    .max(1000, 'Keep it under 1,000 characters'),
})
type FormValues = z.infer<typeof FormSchema>
const defaultValues: FormValues = { question: '' }

type AlertIssueAskAssistantProps = {
  context: AssistantContext
  className?: string
  children: ReactNode
}

/**
 * Wraps a block of the alert issue with an "Ask Assistant" button in its right margin. The
 * question is posted as an @assistant comment, and the assistant replies in the thread.
 */
export const AlertIssueAskAssistant = ({
  context,
  className,
  children,
}: AlertIssueAskAssistantProps) => {
  const assistant = useAlertIssueAssistant()
  const [isOpen, setIsOpen] = useState(false)
  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues })

  if (!assistant) return <>{children}</>

  const handleAsk = (question: string) => {
    assistant.ask(question, context)
    form.reset(defaultValues)
    setIsOpen(false)
  }

  const onSubmit = ({ question }: FormValues) => handleAsk(question)

  return (
    <div className={cn('group/ask relative', className)}>
      {children}
      <div className="absolute -right-11 top-0 opacity-0 transition-opacity focus-within:opacity-100 group-hover/ask:opacity-100 has-[[data-state=open]]:opacity-100">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <ButtonTooltip
              type="button"
              variant="default"
              className="h-7 w-7 px-0"
              icon={<SparklesIcon size={14} />}
              aria-label="Ask Assistant"
              disabled={assistant.isBusy}
              tooltip={{ content: { side: 'right', text: 'Ask Assistant' } }}
            />
          </PopoverTrigger>
          <PopoverContent side="left" align="start" className="w-80 p-3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
                <p className="text-xs text-foreground-lighter">Ask about {context.label}</p>
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItemLayout>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Ask about this…"
                          aria-label="Ask the Assistant"
                        />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
                <div className="flex flex-wrap items-center gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <Button
                      key={action}
                      type="button"
                      variant="default"
                      size="tiny"
                      onClick={() => handleAsk(action)}
                    >
                      {action}
                    </Button>
                  ))}
                  <Button type="submit" variant="primary" size="tiny" className="ml-auto">
                    Ask
                  </Button>
                </div>
              </form>
            </Form>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
