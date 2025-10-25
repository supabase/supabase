import { zodResolver } from '@hookform/resolvers/zod'
import { get as _get, find } from 'lodash'
import { useRouter } from 'next/router'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useDatabasePolicyDeleteMutation } from 'data/database-policies/database-policy-delete-mutation'
import { useAnalyticsBucketDeleteMutation } from 'data/storage/analytics-bucket-delete-mutation'
import { AnalyticsBucket } from 'data/storage/analytics-buckets-query'
import { useBucketDeleteMutation } from 'data/storage/bucket-delete-mutation'
import { Bucket, useBucketsQuery } from 'data/storage/buckets-query'
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
import { useIsNewStorageUIEnabled } from '../App/FeaturePreview/FeaturePreviewContext'
import { formatPoliciesForStorage } from './Storage.utils'

export interface DeleteBucketModalProps {
  visible: boolean
  bucket: Bucket | AnalyticsBucket
  onClose: () => void
}

const formId = `delete-storage-bucket-form`

export const DeleteBucketModal = ({ visible, bucket, onClose }: DeleteBucketModalProps) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const isStorageV2 = useIsNewStorageUIEnabled()

  const schema = z.object({
    confirm: z.literal(bucket.id, {
      errorMap: () => ({ message: `Please enter "${bucket.id}" to confirm` }),
    }),
  })

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  })

  const { data } = useBucketsQuery({ projectRef })
  const buckets = data ?? []

  const { data: policies } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'storage',
  })
  const { mutateAsync: deletePolicy } = useDatabasePolicyDeleteMutation()

  const { mutate: deleteBucket, isLoading: isDeletingBucket } = useBucketDeleteMutation({
    onSuccess: async () => {
      if (!project) return console.error('Project is required')

      // Clean up policies from the corresponding bucket that was deleted
      const storageObjectsPolicies = (policies ?? []).filter((policy) => policy.table === 'objects')
      const formattedStorageObjectPolicies = formatPoliciesForStorage(
        buckets,
        storageObjectsPolicies
      )
      const bucketPolicies = _get(
        find(formattedStorageObjectPolicies, { name: bucket.id }),
        ['policies'],
        []
      )

      try {
        await Promise.all(
          bucketPolicies.map((policy: any) =>
            deletePolicy({
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              originalPolicy: policy,
            })
          )
        )

        toast.success(`Successfully deleted bucket ${bucket.id}`)
        if (isStorageV2) {
          router.push(`/project/${projectRef}/storage/files`)
        } else {
          router.push(`/project/${projectRef}/storage/buckets`)
        }
        onClose()
      } catch (error) {
        toast.success(
          `Successfully deleted bucket ${bucket.id}. However, there was a problem deleting the policies tied to the bucket. Please review them in the storage policies section`
        )
      }
    },
  })

  const { mutate: deleteAnalyticsBucket, isLoading: isDeletingAnalyticsBucket } =
    useAnalyticsBucketDeleteMutation({
      onSuccess: () => {
        toast.success(`Successfully deleted analytics bucket ${bucket.id}`)
        if (isStorageV2) {
          router.push(`/project/${projectRef}/storage/analytics`)
        } else {
          router.push(`/project/${projectRef}/storage/buckets`)
        }
        onClose()
      },
    })

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucket) return console.error('No bucket is selected')

    // [Joshen] We'll need a third case to figure out for vector buckets
    if ('type' in bucket && bucket.type === 'STANDARD') {
      deleteBucket({ projectRef, id: bucket.id })
    } else {
      deleteAnalyticsBucket({ projectRef, id: bucket.id })
    }
  }

  const isDeleting = isDeletingBucket || isDeletingAnalyticsBucket

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
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
