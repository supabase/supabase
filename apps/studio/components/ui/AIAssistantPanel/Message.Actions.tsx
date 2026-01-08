import { Pencil, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react'
import { type PropsWithChildren, useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { ButtonTooltip } from '../ButtonTooltip'
import {
  cn,
  Button,
  Popover_Shadcn_,
  PopoverTrigger_Shadcn_,
  PopoverContent_Shadcn_,
  Form_Shadcn_,
  FormField_Shadcn_,
  FormControl_Shadcn_,
  TextArea_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export function MessageActions({
  children,
  alwaysShow = false,
}: PropsWithChildren<{ alwaysShow?: boolean }>) {
  return (
    <div className="flex items-center gap-4 mt-2 mb-1">
      <span className="h-0.5 w-5 bg-muted" />
      <div className={cn('group-hover:opacity-100 transition-opacity', !alwaysShow && 'opacity-0')}>
        {children}
      </div>
    </div>
  )
}
function MessageActionsEdit({ onClick, tooltip }: { onClick: () => void; tooltip: string }) {
  return (
    <ButtonTooltip
      type="text"
      icon={<Pencil size={14} strokeWidth={1.5} />}
      onClick={onClick}
      className="text-foreground-light hover:text-foreground p-1 rounded"
      aria-label={tooltip}
      tooltip={{
        content: {
          side: 'bottom',
          text: tooltip,
        },
      }}
    />
  )
}
MessageActions.Edit = MessageActionsEdit

function MessageActionsDelete({ onClick }: { onClick: () => void }) {
  return (
    <ButtonTooltip
      type="text"
      icon={<Trash2 size={14} strokeWidth={1.5} />}
      tooltip={{ content: { side: 'bottom', text: 'Delete message' } }}
      onClick={onClick}
      className="text-foreground-light hover:text-foreground p-1 rounded"
      title="Delete message"
      aria-label="Delete message"
    />
  )
}
MessageActions.Delete = MessageActionsDelete

function MessageActionsThumbsUp({
  onClick,
  isActive,
  disabled,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
}) {
  return (
    <Button
      type="text"
      disabled={disabled}
      icon={
        <ThumbsUp
          size={14}
          strokeWidth={1.5}
          className={cn(
            isActive
              ? 'text-brand hover:text-brand-700'
              : 'text-foreground-light hover:text-foreground'
          )}
        />
      }
      onClick={onClick}
      className={cn('p-1 rounded transition-colors', disabled && 'opacity-50 pointer-events-none')}
      title="Good response"
      aria-label="Good response"
    />
  )
}
MessageActions.ThumbsUp = MessageActionsThumbsUp

const feedbackSchema = z.object({
  reason: z.string().optional(),
})

type FeedbackFormValues = z.infer<typeof feedbackSchema>

function MessageActionsThumbsDown({
  onClick,
  isActive,
  disabled,
}: {
  onClick: (reason?: string) => void
  isActive?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { reason: '' },
    mode: 'onSubmit',
  })

  const handleOpenChange = (newOpen: boolean) => {
    if (disabled) return
    // When popover closes, submit the rating if not already submitted
    if (!newOpen && open && !form.formState.isSubmitSuccessful) {
      onClick()
    }
    setOpen(newOpen)
    if (!newOpen) {
      form.reset()
    }
  }

  const onSubmit = (values: FeedbackFormValues) => {
    onClick(values.reason || undefined)
  }

  // Auto-close popover after showing thank you message
  useEffect(() => {
    if (form.formState.isSubmitSuccessful) {
      const timer = setTimeout(() => {
        setOpen(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [form.formState.isSubmitSuccessful])

  return (
    <Popover_Shadcn_ open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="text"
          disabled={disabled}
          onClick={() => !disabled && setOpen(true)}
          className={cn(
            'p-1 rounded transition-colors',
            disabled && 'opacity-50 pointer-events-none'
          )}
          title="Bad response"
          aria-label="Bad response"
        >
          <ThumbsDown
            size={14}
            strokeWidth={1.5}
            className={cn(
              isActive
                ? 'text-warning hover:text-warning-700'
                : 'text-foreground-light hover:text-foreground'
            )}
          />
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ portal className="w-80" align="start">
        {form.formState.isSubmitSuccessful ? (
          <p className="text-sm">We appreciate your feedback!</p>
        ) : (
          <Form_Shadcn_ {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField_Shadcn_
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItemLayout label="What went wrong?" labelOptional="optional">
                    <FormControl_Shadcn_>
                      <TextArea_Shadcn_
                        placeholder="Describe why the response was not helpful..."
                        autoComplete="off"
                        rows={4}
                        autoFocus
                        {...field}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <div className="flex justify-end">
                <Button type="primary" htmlType="submit" size="tiny">
                  Submit feedback
                </Button>
              </div>
            </form>
          </Form_Shadcn_>
        )}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
MessageActions.ThumbsDown = MessageActionsThumbsDown
