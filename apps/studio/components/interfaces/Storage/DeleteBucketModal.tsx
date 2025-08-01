import { useState } from 'react'
import { useParams } from 'common'
import { get as _get, find } from 'lodash'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useDatabasePolicyDeleteMutation } from 'data/database-policies/database-policy-delete-mutation'
import { useBucketDeleteMutation } from 'data/storage/bucket-delete-mutation'
import { Bucket, useBucketsQuery } from 'data/storage/buckets-query'
import { formatPoliciesForStorage } from './Storage.utils'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Input_Shadcn_,
  Label_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'

export interface DeleteBucketModalProps {
  bucket: Bucket
  onClose: () => void
}

export const DeleteBucketModal = ({ bucket, onClose }: DeleteBucketModalProps) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const [value, setValue] = useState<string>(``)

  const { data } = useBucketsQuery({ projectRef })
  const { data: policies } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'storage',
  })
  const { mutateAsync: deletePolicy } = useDatabasePolicyDeleteMutation()

  const { mutate: deleteBucket, isLoading } = useBucketDeleteMutation({
    onSuccess: async () => {
      if (!project) return console.error('Project is required')

      // Clean up policies from the corresponding bucket that was deleted
      const storageObjectsPolicies = (policies ?? []).filter((policy) => policy.table === 'objects')
      const formattedStorageObjectPolicies = formatPoliciesForStorage(
        buckets,
        storageObjectsPolicies
      )
      const bucketPolicies = _get(
        find(formattedStorageObjectPolicies, { name: bucket.name }),
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

        toast.success(`Successfully deleted bucket ${bucket.name}`)
        router.push(`/project/${projectRef}/storage/buckets`)
        onClose()
      } catch (error) {
        toast.success(
          `Successfully deleted bucket ${bucket.name}. However, there was a problem deleting the policies tied to the bucket. Please review them in the storage policies section`
        )
      }
    },
  })

  const buckets = data ?? []

  const onDeleteBucket = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucket) return console.error('No bucket is selected')
    deleteBucket({ projectRef, id: bucket.id, type: bucket.type })
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`Confirm deletion of ${bucket.name}`}</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-4">
          <Admonition
            type="destructive"
            title="You cannot recover this bucket once deleted."
            description="All bucket data will be lost."
          />
          <p>
            Your bucket <span className="font-bold text-foreground">{bucket.name}</span> and all its
            contents will be permanently deleted.
          </p>
        </DialogSection>
        <DialogSectionSeparator />
        <DialogSection>
          <Label_Shadcn_ htmlFor="confirm">
            Type <span className="font-bold text-foreground">{bucket.name}</span> to confirm.
          </Label_Shadcn_>
          <Input_Shadcn_
            id="confirm"
            value={value}
            autoComplete="off"
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type in name of bucket"
          />
        </DialogSection>
        <DialogFooter>
          <Button type="default" disabled={isLoading} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="danger"
            disabled={value !== bucket.name}
            loading={isLoading}
            onClick={onDeleteBucket}
          >
            Delete Bucket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteBucketModal
