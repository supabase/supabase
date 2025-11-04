import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/router'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useAnalyticsBucketDeleteMutation } from 'data/storage/analytics-bucket-delete-mutation'
import { AnalyticsBucket } from 'data/storage/analytics-buckets-query'
import { Bucket } from 'data/storage/buckets-query'
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
  bucket: Bucket | AnalyticsBucket
  onClose: () => void
  onSuccess?: () => void
}

const formId = `delete-analytics-bucket-form`

export const DeleteAnalyticsBucketModal = ({
  visible,
  bucket,
  onClose,
  onSuccess,
}: DeleteAnalyticsBucketModalProps) => {
  const router = useRouter()
  const { ref: projectRef, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const schema = z.object({
    confirm: z.literal(bucket.id, {
      errorMap: () => ({ message: `Please enter "${bucket.id}" to confirm` }),
    }),
  })

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  })

  const { icebergWrapper, icebergWrapperMeta, s3AccessKey, publication } =
    useAnalyticsBucketAssociatedEntities({ projectRef, bucketId: bucket.id })

  const { mutateAsync: deleteAnalyticsBucketCleanUp, isLoading: isCleaningUpAnalyticsBucket } =
    useAnalyticsBucketDeleteCleanUp()

  const { mutate: deleteAnalyticsBucket, isLoading: isDeletingAnalyticsBucket } =
    useAnalyticsBucketDeleteMutation({
      onSuccess: async () => {
        if (project?.connectionString) {
          await deleteAnalyticsBucketCleanUp({
            projectRef,
            connectionString: project.connectionString,
            bucketId: bucket.id,
            icebergWrapper,
            icebergWrapperMeta,
            s3AccessKey,
            publication,
          })
        }
        toast.success(`Successfully deleted analytics bucket ${bucket.id}`)
        onClose()
        onSuccess?.()
      },
    })

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucket) return console.error('No bucket is selected')
    deleteAnalyticsBucket({ projectRef, id: bucket.id })
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
          <DialogTitle>Confirm deletion of {bucket.id}</DialogTitle>
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
            Your bucket <span className="font-bold text-foreground">{bucket.id}</span> and all its
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
                        Type <span className="font-bold text-foreground">{bucket.id}</span> to
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
