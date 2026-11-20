'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useId, type RefObject } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  Textarea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

interface LayoutSwitchFeedbackDialogProps {
  isOpen: boolean
  returnFocusRef: RefObject<HTMLButtonElement | null>
  onCancel: () => void
  onSubmit: (comment: string) => Promise<void>
}

const formSchema = z.object({
  comment: z.string().trim(),
})

type LayoutSwitchFeedbackFields = z.infer<typeof formSchema>

const DEFAULT_VALUES: LayoutSwitchFeedbackFields = { comment: '' }

export const LayoutSwitchFeedbackDialog = ({
  isOpen,
  returnFocusRef,
  onCancel,
  onSubmit,
}: LayoutSwitchFeedbackDialogProps) => {
  const form = useForm<LayoutSwitchFeedbackFields>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(formSchema),
  })
  const { isSubmitting } = form.formState
  const formId = useId()

  const handleOpenChange = (isNextOpen: boolean) => {
    if (isNextOpen || isSubmitting) return
    form.reset()
    onCancel()
  }

  const handleCancel = () => handleOpenChange(false)

  // the dialog has no trigger, so radix has no element to return focus to
  const handleCloseAutoFocus = (event: Event) => {
    event.preventDefault()
    returnFocusRef.current?.focus()
  }

  const handleSubmit: SubmitHandler<LayoutSwitchFeedbackFields> = ({ comment }) => onSubmit(comment)

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent onCloseAutoFocus={handleCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>Switch to classic layout</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form {...form}>
          <form id={formId} onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogSection>
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItemLayout
                    layout="vertical"
                    label="What made you switch back?"
                    labelOptional="Optional"
                  >
                    <FormControl>
                      <Textarea {...field} rows={4} className="resize-none" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </DialogSection>
          </form>
        </Form>
        <DialogFooter>
          <Button disabled={isSubmitting} onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form={formId}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Switch to classic layout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
