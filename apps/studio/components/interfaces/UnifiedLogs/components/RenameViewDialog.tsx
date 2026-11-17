import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
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

import { type LogsView } from '../UnifiedLogs.views'
import { VIEW_NAME_MAX_LENGTH } from './SaveViewDialog'

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name for this view')
    .max(VIEW_NAME_MAX_LENGTH, `Keep the name to ${VIEW_NAME_MAX_LENGTH} characters or less.`),
})

interface RenameViewDialogProps {
  view: LogsView | null
  onCancel: () => void
  onRename: (id: string, name: string) => Promise<void>
}

export const RenameViewDialog = ({ view, onCancel, onRename }: RenameViewDialogProps) => {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })
  const { isSubmitting } = form.formState
  const name = useWatch({ control: form.control, name: 'name' })
  const isNameEmpty = name.trim().length === 0

  const { reset } = form
  useEffect(() => {
    if (view) reset({ name: view.name })
  }, [view, reset])

  const onSubmit = async ({ name: nextName }: z.infer<typeof schema>) => {
    if (!view) return
    try {
      if (nextName !== view.name) await onRename(view.id, nextName)
      onCancel()
    } catch {
      return
    }
  }

  return (
    <Dialog
      open={view !== null}
      onOpenChange={() => {
        if (!isSubmitting) onCancel()
      }}
    >
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Rename view</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
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
              <Button type="reset" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting || isNameEmpty}
              >
                Rename view
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
