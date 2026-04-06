import { ident } from '@supabase/pg-meta/src/pg-format'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { databasePoliciesKeys } from '@/data/database-policies/keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import { storageKeys } from '@/data/storage/keys'
import { usePublicBucketsWithSelectPoliciesQuery } from '@/data/storage/public-buckets-with-select-policies-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

function generatePolicyRemovalSql(policyName: string) {
  return `DROP POLICY IF EXISTS ${ident(policyName)} ON storage.objects;`
}

export interface PublicBucketWarningProps {
  projectRef: string
  bucketId: string
}

export function PublicBucketWarning({ projectRef, bucketId }: PublicBucketWarningProps): ReactNode {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()

  const { data } = usePublicBucketsWithSelectPoliciesQuery({
    projectRef,
    connectionString: project?.connectionString,
    bucketId,
  })
  const policyToRemove = data?.[0]

  const { mutate: removePolicy, isPending: isRemovingPolicy } = useMutation({
    mutationFn: async (policyName: string) => {
      await executeSql({
        projectRef,
        connectionString: project?.connectionString,
        sql: generatePolicyRemovalSql(policyName),
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: storageKeys.publicBucketsWithSelectPolicies(projectRef, bucketId),
        }),
        queryClient.invalidateQueries({
          queryKey: databasePoliciesKeys.list(projectRef, 'storage'),
        }),
      ])
      setShowModal(false)
      toast.success('Policy removed successfully')
    },
    onError: (error) => {
      console.error('Failed to remove policy', error)
      toast.error(`Failed to remove policy: ${error.message}`)
    },
  })

  const [showModal, setShowModal] = useState(false)

  return policyToRemove ? (
    <PublicBucketWarningView
      _tag="policy-to-remove"
      policyName={policyToRemove.policyname}
      isRemovingPolicy={isRemovingPolicy}
      onRemovePolicy={() => removePolicy(policyToRemove.policyname)}
      isModalVisible={showModal}
      onShowModal={() => setShowModal(true)}
      onHideModal={() => setShowModal(false)}
    />
  ) : (
    <PublicBucketWarningView _tag="no-policy-to-remove" />
  )
}

type PublicBucketWarningViewProps_NoPolicyToRemove = {
  _tag: 'no-policy-to-remove'
}

type PublicBucketWarningViewProps_PolicyToRemove = {
  _tag: 'policy-to-remove'
  policyName: string
  isRemovingPolicy: boolean
  onRemovePolicy: () => void
  isModalVisible: boolean
  onShowModal: () => void
  onHideModal: () => void
}

type PublicBucketWarningViewProps =
  | PublicBucketWarningViewProps_NoPolicyToRemove
  | PublicBucketWarningViewProps_PolicyToRemove

function PublicBucketWarningView(props: PublicBucketWarningViewProps): ReactNode {
  if (props._tag === 'no-policy-to-remove') {
    return null
  }

  const { policyName, isRemovingPolicy, onRemovePolicy, isModalVisible, onShowModal, onHideModal } =
    props

  return (
    <>
      <Admonition
        type="warning"
        layout="horizontal"
        title="Anyone can list all files in this bucket"
        description="A SELECT policy on storage.objects allows clients to retrieve a full list of files. Public buckets don’t need this and it may expose more data than intended."
        actions={
          <Button type="warning" size="tiny" onClick={onShowModal}>
            Remove policy
          </Button>
        }
      />
      <ConfirmationModal
        visible={isModalVisible}
        variant="destructive"
        title="Remove SELECT policy"
        confirmLabel="Remove policy"
        loading={isRemovingPolicy}
        onCancel={onHideModal}
        onConfirm={onRemovePolicy}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-foreground-light">
            This will drop the <code>SELECT</code> policy that makes the bucket&apos;s contents
            listable. Object URLs will continue to work.
          </p>
          <div className="-mx-4 md:-mx-5 -mb-4 border-t">
            <CodeBlock
              hideLineNumbers
              language="sql"
              value={generatePolicyRemovalSql(policyName)}
              wrapperClassName="[&_pre]:px-4 [&_pre]:py-3 [&>pre]:rounded-none [&>pre]:border-0 [&_pre>*]:!whitespace-pre-wrap"
              className="[&_code]:text-foreground"
            />
          </div>
        </div>
      </ConfirmationModal>
    </>
  )
}
