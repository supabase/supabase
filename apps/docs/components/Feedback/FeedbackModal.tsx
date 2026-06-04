import { zodResolver } from '@hookform/resolvers/zod'
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
  const formId = 'feedback-form'
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
    <Dialog open={visible} onOpenChange={() => onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave a comment</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form {...form}>
          <form id={formId} onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogSection className="space-y-4">
              <input type="hidden" id="page" {...form.register('page')} />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Title">
                    <FormControl className="col-span-6">
                      <Input {...field} />
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
                <span className="shrink-0 mt-0.5">💡</span>
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
            </DialogSection>
          </form>
        </Form>
        <DialogFooter>
          <div className="flex items-center justify-end gap-2">
            <Button htmlType="reset" type="default" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button htmlType="submit" form={formId} loading={isSubmitting} disabled={isSubmitting}>
              Submit feedback
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { FeedbackModal }
