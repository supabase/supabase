import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useAnalyticsBucketDeleteMutation } from 'data/storage/analytics-bucket-delete-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  useAnalyticsBucketAssociatedEntities,
  useAnalyticsBucketDeleteCleanUp,
} from './AnalyticsBucketDetails/useAnalyticsBucketAssociatedEntities'

export interface DeleteAnalyticsBucketModalProps {
  visible: boolean
  bucketId?: string
  onClose: () => void
  onSuccess?: () => void
}

const formId = `delete-analytics-bucket-form`

// [Joshen] Can refactor to use TextConfirmModal

export const DeleteAnalyticsBucketModal = ({
  visible,
  bucketId,
  onClose,
  onSuccess,
}: DeleteAnalyticsBucketModalProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const schema = z.object({
    confirm: z.literal(bucketId, {
      errorMap: () => ({ message: `Please enter "${bucketId}" to confirm` }),
    }),
  })

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  })

  const { icebergWrapper, icebergWrapperMeta, s3AccessKey, publication } =
    useAnalyticsBucketAssociatedEntities({ projectRef, bucketId: bucketId })

  const { mutateAsync: deleteAnalyticsBucketCleanUp, isLoading: isCleaningUpAnalyticsBucket } =
    useAnalyticsBucketDeleteCleanUp()

  const { mutate: deleteAnalyticsBucket, isLoading: isDeletingAnalyticsBucket } =
    useAnalyticsBucketDeleteMutation({
      onSuccess: async () => {
        if (project?.connectionString) {
          await deleteAnalyticsBucketCleanUp({
            projectRef,
            connectionString: project.connectionString,
            bucketId: bucketId,
            icebergWrapper,
            icebergWrapperMeta,
            s3AccessKey,
            publication,
          })
        }
        toast.success(`Successfully deleted analytics bucket ${bucketId}`)
        onClose()
        onSuccess?.()
      },
    })

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucketId) return console.error('No bucket is selected')
    deleteAnalyticsBucket({ projectRef, id: bucketId })
  }

  const isDeleting = isDeletingAnalyticsBucket || isCleaningUpAnalyticsBucket

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Confirm deletion of {bucketId}</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <Admonition
          type="destructive"
          className="rounded-none border-x-0 border-t-0 mb-0"
          title="You cannot recover this bucket once deleted."
          description="All bucket data will be lost."
        />

        <DialogSection>
          <p className="text-sm">
            Your bucket <span className="font-bold text-foreground">{bucketId}</span> and all its
            contents will be permanently deleted.
          </p>
        </DialogSection>
        <DialogSectionSeparator />
        <DialogSection>
          <Form_Shadcn_ {...form}>
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
              <FormField_Shadcn_
                key="confirm"
                name="confirm"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="confirm"
                    label={
                      <>
                        Type <span className="font-bold text-foreground">{bucketId}</span> to
                        confirm.
                      </>
                    }
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        id="confirm"
                        autoComplete="off"
                        {...field}
                        placeholder="Type bucket name"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogFooter>
          <Button type="default" disabled={isDeleting} onClick={onClose}>
            Cancel
          </Button>
          <Button form={formId} htmlType="submit" type="danger" loading={isDeleting}>
            Delete bucket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
