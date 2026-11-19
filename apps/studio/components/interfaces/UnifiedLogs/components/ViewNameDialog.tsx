import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
  Input,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { isDuplicateViewName, VIEW_NAME_MAX_LENGTH } from './LogsViews.utils'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'

interface ViewNameDialogProps {
  open: boolean
  title: string
  confirmLabel: string
  initialName?: string
  existingNames?: string[]
  discardDescription: string
  onCancel: () => void
  onSubmit: (name: string) => Promise<void>
}

export const ViewNameDialog = ({
  open,
  title,
  confirmLabel,
  initialName,
  existingNames = [],
  discardDescription,
  onCancel,
  onSubmit,
}: ViewNameDialogProps) => {
  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, 'Enter a name for this view')
          .max(VIEW_NAME_MAX_LENGTH, `Keep the name to ${VIEW_NAME_MAX_LENGTH} characters or less.`)
          .refine(
            (name) => !isDuplicateViewName(name, existingNames),
            "That name's already taken. Try another."
          ),
      }),
    [existingNames]
  )

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })
  const { isSubmitting, isDirty } = form.formState
  const name = useWatch({ control: form.control, name: 'name' })
  const isNameEmpty = name.trim().length === 0

  const { reset } = form
  useEffect(() => {
    if (open) reset({ name: initialName ?? '' })
  }, [open, initialName, reset])

  const {
    confirmOnClose,
    handleOpenChange,
    modalProps: discardChangesModalProps,
  } = useConfirmOnClose({ checkIsDirty: () => isDirty, onClose: onCancel })

  const handleSubmit = async ({ name: nextName }: z.infer<typeof schema>) => {
    try {
      await onSubmit(nextName)
      onCancel()
    } catch {}
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!isSubmitting) handleOpenChange(nextOpen)
        }}
      >
        <DialogContent size="small">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
              <DialogSection>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItemLayout layout="vertical" label="Name">
                      <FormControl>
                        <Input {...field} autoFocus placeholder="Enter a name for this view" />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </DialogSection>
              <DialogFooter>
                <Button type="reset" onClick={confirmOnClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting || isNameEmpty}
                >
                  {confirmLabel}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <DiscardChangesConfirmationDialog
        {...discardChangesModalProps}
        description={discardDescription}
      />
    </>
  )
}
