import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
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
  Textarea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

const formSchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
})

type SavedQuery = z.infer<typeof formSchema>

export interface UpdateSavedQueryProps {
  header: string
  visible: boolean
  onCancel: () => void
  onSubmit: SubmitHandler<SavedQuery>
  initialValues: SavedQuery
}

export const UpdateSavedQueryModal = ({
  header,
  visible,
  onCancel,
  onSubmit,
  initialValues,
}: UpdateSavedQueryProps) => {
  const form = useForm<SavedQuery>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...initialValues, description: initialValues.description ?? '' },
  })
  const { reset, formState } = form
  const { isDirty, isSubmitting } = formState

  useEffect(() => {
    if (isDirty) return
    reset({ ...initialValues, description: initialValues.description ?? '' })
  }, [isDirty, initialValues, reset])

  const handleCancel = () => {
    form.reset()
    onCancel()
  }

  return (
    <Dialog open={visible} onOpenChange={handleCancel}>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>{header}</DialogTitle>
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
                      <Input {...field} placeholder="Enter text" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </DialogSection>
            <DialogSection>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Description">
                    <FormControl>
                      <Textarea {...field} placeholder="Describe query" className="resize-none" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </DialogSection>
            <DialogFooter>
              <Button
                htmlType="reset"
                type="default"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button htmlType="submit" loading={isSubmitting} disabled={isSubmitting || !isDirty}>
                Save query
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
