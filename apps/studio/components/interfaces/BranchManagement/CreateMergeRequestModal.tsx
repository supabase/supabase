import { useState } from 'react'
import { useRouter } from 'next/router'
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
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  Textarea,
} from 'ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMergeRequestCreateMutation } from 'data/merge-requests/merge-request-create-mutation'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const mergeRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
})

type MergeRequestForm = z.infer<typeof mergeRequestSchema>

interface CreateMergeRequestModalProps {
  visible: boolean
  onClose: () => void
  projectRef: string
  headBranchName: string
  baseBranchName: string
}

export const CreateMergeRequestModal = ({
  visible,
  onClose,
  projectRef,
  headBranchName,
  baseBranchName,
}: CreateMergeRequestModalProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<MergeRequestForm>({
    resolver: zodResolver(mergeRequestSchema),
    defaultValues: {
      title: `Deploy ${headBranchName} to ${baseBranchName}`,
      description: '',
    },
  })

  const { mutate: createMergeRequest } = useMergeRequestCreateMutation({
    onSuccess: (data) => {
      toast.success('Deploy request created successfully!')
      setIsSubmitting(false)
      onClose()
      form.reset()
      // Redirect to the deploy request page
      router.push(`/project/${projectRef}/merge-requests/${data.id}`)
    },
    onError: (error) => {
      setIsSubmitting(false)
      toast.error(`Failed to create deploy request: ${error.message}`)
    },
  })

  const onSubmit = (values: MergeRequestForm) => {
    setIsSubmitting(true)
    createMergeRequest({
      projectRef,
      title: values.title,
      description: values.description || undefined,
      head: headBranchName,
      base: baseBranchName,
    })
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      form.reset()
    }
  }

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="large">
        <Form_Shadcn_ {...form}>
          <form id="create-merge-request-form" onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Create Deploy Request</DialogTitle>
              <DialogDescription>
                Create a deploy request to merge changes from <code>{headBranchName}</code> into{' '}
                <code>{baseBranchName}</code>.
              </DialogDescription>
            </DialogHeader>
            <DialogSectionSeparator />

            <DialogSection className="space-y-4">
              <FormField_Shadcn_
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItemLayout label="Title">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        placeholder="Enter a title for your deploy request"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItemLayout label="Description (optional)">
                    <FormControl_Shadcn_>
                      <Textarea
                        placeholder="Describe the changes you want to deploy..."
                        className="resize-none"
                        rows={4}
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItemLayout>
                )}
              />
            </DialogSection>

            <DialogFooter>
              <Button type="default" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                form="create-merge-request-form"
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Create Deploy Request
              </Button>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
