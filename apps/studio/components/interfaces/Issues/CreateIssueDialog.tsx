import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useParams } from 'common'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import {
  CATEGORY_LABELS,
  ISSUE_CATEGORIES,
  ISSUE_SEVERITIES,
  SEVERITY_LABELS,
} from './Issues.constants'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { MarkdownEditor } from '@/components/ui/MarkdownEditor/MarkdownEditor'
import { useIssueCreateMutation } from '@/data/issues/issue-create-mutation'
import {
  issueCategorySchema,
  issueSeveritySchema,
  markdownDocument,
} from '@/data/issues/issue-schema'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'

const FORM_ID = 'create-issue-form'

const FormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string(),
  severity: issueSeveritySchema,
  category: issueCategorySchema,
})
type FormValues = z.infer<typeof FormSchema>

const defaultValues: FormValues = {
  title: '',
  description: '',
  severity: 'warning',
  category: 'security',
}

export const CreateIssueDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const navigate = useNavigate()
  const { ref } = useParams()

  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues })
  const { isDirty } = form.formState

  const handleClose = () => {
    onOpenChange(false)
    form.reset(defaultValues)
  }

  const {
    confirmOnClose,
    handleOpenChange,
    modalProps: discardChangesModalProps,
  } = useConfirmOnClose({ checkIsDirty: () => isDirty, onClose: handleClose })

  const { mutate: createIssue, isPending } = useIssueCreateMutation({
    onSuccess: (issue) => {
      toast.success('Issue created')
      handleClose()
      navigate({ to: '/project/$ref/issues/$id', params: { ref: ref ?? '', id: issue.id } })
    },
  })

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    if (!ref) return
    createIssue({
      projectRef: ref,
      payload: {
        title: values.title,
        body: markdownDocument(values.description),
        severity: values.severity,
        category: values.category,
      },
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent size="medium">
          <DialogHeader>
            <DialogTitle>New issue</DialogTitle>
            <DialogDescription>
              Describe a problem in this project. Mention @Assistant in a comment to ask for help.
            </DialogDescription>
          </DialogHeader>
          <DialogSectionSeparator />
          <Form {...form}>
            <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
              <DialogSection className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItemLayout layout="vertical" label="Title">
                      <FormControl>
                        <Input
                          {...field}
                          autoFocus
                          placeholder="Orders table is missing an index"
                        />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="vertical"
                      label="Description"
                      description="Markdown supported"
                    >
                      <FormControl>
                        <MarkdownEditor
                          ariaLabel="Description"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="What did you see, and where?"
                          className="min-h-32 rounded-md border p-3"
                        />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItemLayout layout="vertical" label="Severity">
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ISSUE_SEVERITIES.map((severity) => (
                              <SelectItem key={severity} value={severity}>
                                {SEVERITY_LABELS[severity]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItemLayout>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItemLayout layout="vertical" label="Category">
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ISSUE_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {CATEGORY_LABELS[category]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItemLayout>
                    )}
                  />
                </div>
              </DialogSection>
            </form>
          </Form>
          <DialogFooter>
            <Button variant="default" disabled={isPending} onClick={confirmOnClose}>
              Cancel
            </Button>
            <Button form={FORM_ID} type="submit" variant="primary" loading={isPending}>
              Create issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DiscardChangesConfirmationDialog {...discardChangesModalProps} />
    </>
  )
}
