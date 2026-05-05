import { ident } from '@supabase/pg-meta/src/pg-format'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LOCAL_STORAGE_KEYS } from 'common'
import { useEffect, useState, type ReactNode } from 'react'
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
import { useTrack } from '@/lib/telemetry/track'

const DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1000 // 14 days

function isDismissed(projectRef: string, bucketId: string): boolean {
  try {
    const raw = localStorage.getItem(
      LOCAL_STORAGE_KEYS.STORAGE_PUBLIC_BUCKET_SELECT_POLICY_WARNING_DISMISSED(projectRef, bucketId)
    )
    if (!raw) return false
    const { dismissedAt } = JSON.parse(raw) as { dismissedAt: string }
    return Date.now() - new Date(dismissedAt).getTime() < DISMISS_DURATION_MS
  } catch {
    return false
  }
}

function persistDismiss(projectRef: string, bucketId: string): void {
  localStorage.setItem(
    LOCAL_STORAGE_KEYS.STORAGE_PUBLIC_BUCKET_SELECT_POLICY_WARNING_DISMISSED(projectRef, bucketId),
    JSON.stringify({ dismissedAt: new Date().toISOString() })
  )
}

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
  const matchingPolicyCount = data?.length ?? 0

  const track = useTrack()

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
      track('storage_public_bucket_select_policy_removed', { bucketId })
      setShowModal(false)
      toast.success(
        matchingPolicyCount > 1
          ? `Policy removed successfully. ${matchingPolicyCount - 1} matching ${
              matchingPolicyCount - 1 === 1 ? 'policy' : 'policies'
            } remaining.`
          : 'Policy removed successfully'
      )
    },
    onError: (error) => {
      console.error('Failed to remove policy', error)
      toast.error(`Failed to remove policy: ${error.message}`)
    },
  })

  const [showModal, setShowModal] = useState(false)
  const [dismissed, setDismissed] = useState(() => isDismissed(projectRef, bucketId))

  useEffect(() => {
    setDismissed(isDismissed(projectRef, bucketId))
    setShowModal(false)
  }, [bucketId, projectRef])

  function handleDismiss() {
    persistDismiss(projectRef, bucketId)
    track('storage_public_bucket_select_policy_warning_dismiss_button_clicked', { bucketId })
    setDismissed(true)
  }

  return policyToRemove && !dismissed ? (
    <PublicBucketWarningView
      _tag="policy-to-remove"
      policyName={policyToRemove.policyname}
      policyCount={matchingPolicyCount}
      isRemovingPolicy={isRemovingPolicy}
      onRemovePolicy={() => removePolicy(policyToRemove.policyname)}
      isModalVisible={showModal}
      onShowModal={() => setShowModal(true)}
      onHideModal={() => setShowModal(false)}
      onDismiss={handleDismiss}
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
  policyCount: number
  isRemovingPolicy: boolean
  onRemovePolicy: () => void
  isModalVisible: boolean
  onShowModal: () => void
  onHideModal: () => void
  onDismiss: () => void
}

type PublicBucketWarningViewProps =
  | PublicBucketWarningViewProps_NoPolicyToRemove
  | PublicBucketWarningViewProps_PolicyToRemove

function PublicBucketWarningView(props: PublicBucketWarningViewProps): ReactNode {
  if (props._tag === 'no-policy-to-remove') {
    return null
  }

  const {
    policyName,
    policyCount,
    isRemovingPolicy,
    onRemovePolicy,
    isModalVisible,
    onShowModal,
    onHideModal,
    onDismiss,
  } = props
  const hasMultiplePolicies = policyCount > 1

  return (
    <>
      <Admonition
        type="warning"
        layout="horizontal"
        title="Clients can list all files in this bucket"
        description={
          hasMultiplePolicies
            ? `${policyCount} broad SELECT policies on storage.objects allow clients to retrieve a full list of files. Public buckets don’t need these policies and they may expose more data than intended.`
            : 'A broad SELECT policy on storage.objects allows clients to retrieve a full list of files. Public buckets don’t need this and it may expose more data than intended.'
        }
        actions={
          <div className="flex gap-2">
            <Button type="default" size="tiny" onClick={onDismiss}>
              Dismiss
            </Button>
            <Button type="warning" size="tiny" onClick={onShowModal}>
              Remove policy
            </Button>
          </div>
        }
      />
      <ConfirmationModal
        visible={isModalVisible}
        variant="destructive"
        title={
          hasMultiplePolicies
            ? `Remove SELECT policy (1 of ${policyCount})`
            : 'Remove SELECT policy'
        }
        confirmLabel="Remove policy"
        loading={isRemovingPolicy}
        onCancel={onHideModal}
        onConfirm={onRemovePolicy}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-foreground-light">
            This will drop {hasMultiplePolicies ? 'one' : 'the'} <code>SELECT</code> policy that
            makes the bucket&apos;s contents listable. Object URLs will continue to work.
            {hasMultiplePolicies
              ? ` ${policyCount - 1} matching ${
                  policyCount - 1 === 1 ? 'policy' : 'policies'
                } will remain after this.`
              : null}
          </p>
          <div className="-mx-4 md:-mx-5 -mb-4 border-t">
            <CodeBlock
              hideLineNumbers
              language="sql"
              value={generatePolicyRemovalSql(policyName)}
              wrapperClassName="[&_pre]:px-4 [&_pre]:py-3 [&>pre]:rounded-none [&>pre]:border-0 [&_pre>*]:whitespace-pre-wrap!"
              className="[&_code]:text-foreground"
            />
          </div>
        </div>
      </ConfirmationModal>
    </>
  )
}
