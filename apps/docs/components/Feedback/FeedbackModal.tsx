import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import { Button, Form, FormControl, FormField, Input_Shadcn_, Modal, Textarea } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

const formSchema = z.object({
  page: z.string(),
  title: z.string().min(1, 'Required'),
  comment: z.string().min(1, 'Required'),
})

export type FeedbackFields = z.infer<typeof formSchema>

type FeedbackModalProps = {
  visible: boolean
  page: string
  onCancel: () => void
  onSubmit: (values: FeedbackFields) => void
}

function FeedbackModal({ visible, page, onCancel, onSubmit }: FeedbackModalProps) {
  const form = useForm<FeedbackFields>({
    defaultValues: { page, title: '', comment: '' },
    resolver: zodResolver(formSchema),
  })
  const { reset } = form
  const { isSubmitting } = form.formState

  const handleCancel = () => {
    reset()
    onCancel()
  }

  const handleSubmit: SubmitHandler<FeedbackFields> = (values) => {
    onSubmit(values)
    reset()
  }

  return (
    <Modal
      hideFooter
      header="Leave a comment"
      visible={visible}
      onCancel={handleCancel}
      onEscapeKeyDown={handleCancel}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Modal.Content className="pt-4 pb-2 flex flex-col gap-2">
            <input type="hidden" id="page" {...form.register('page')} />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItemLayout layout="vertical" label="Title">
                  <FormControl className="col-span-6">
                    <Input_Shadcn_ {...field} />
                  </FormControl>
                </FormItemLayout>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItemLayout layout="vertical" label="Comment" afterLabel="(not anonymous)">
                  <FormControl className="col-span-6">
                    <Textarea {...field} rows={4} className="resize-none" />
                  </FormControl>
                </FormItemLayout>
              )}
            />
            <div className="flex gap-2 text-xs text-foreground-light leading-relaxed">
              <span className="flex-shrink-0 mt-0.5">💡</span>
              <div>
                <strong>Need help or support?</strong> This feedback form is for documentation
                improvements only. For technical support, please submit a{' '}
                <a
                  href="https://supabase.com/dashboard/support/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-link hover:underline"
                >
                  support request
                </a>
                .
              </div>
            </div>
          </Modal.Content>
          <Modal.Separator />
          <Modal.Content className="pt-2 pb-4">
            <div className="flex items-center justify-end gap-2">
              <Button
                htmlType="reset"
                type="default"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
                Submit feedback
              </Button>
            </div>
          </Modal.Content>
        </form>
      </Form>
    </Modal>
  )
}

export { FeedbackModal }
