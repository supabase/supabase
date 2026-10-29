import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { CardContent, Table, TableBody, TableHead, TableHeader, TableRow } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  canWriteRules,
  describeRule,
  removeRule,
  setRuleStatus,
  type LifecycleRuleStatus,
} from './BucketLifecycleRules.utils'
import { LifecycleRuleRow } from './LifecycleRuleRow'
import { LifecycleRuleSheet } from './LifecycleRuleSheet'
import { useIsStorageVersioningEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { getBucketVersioningState } from '@/components/interfaces/Storage/StorageVersioning.constants'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { bucketLifecycleQueryOptions } from '@/data/storage/bucket-lifecycle-query'
import { useBucketLifecycleUpdateMutation } from '@/data/storage/bucket-lifecycle-update-mutation'
import type { Bucket } from '@/data/storage/buckets-query'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useTrack } from '@/lib/telemetry/track'

/** `index` null adds a rule, otherwise it is the position of the rule being edited. */
type SheetState = { index: number | null }

interface BucketLifecycleRulesProps {
  projectRef: string
  bucket: Bucket
}

/**
 * Lifecycle rules only expire noncurrent versions, so they're shown for buckets that have
 * ever been versioned. Rows mirror the API's rule objects field for field.
 */
export const BucketLifecycleRules = ({ projectRef, bucket }: BucketLifecycleRulesProps) => {
  const isStorageVersioningEnabled = useIsStorageVersioningEnabled()
  const isVersionedBucket = getBucketVersioningState(bucket) !== 'disabled'
  const isVisible = isStorageVersioningEnabled && isVersionedBucket

  const track = useTrack()
  const [sheetState, setSheetState] = useState<SheetState | null>(null)
  const [ruleIndexToDelete, setRuleIndexToDelete] = useState<number | null>(null)

  const { can: canUpdateBuckets } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.STORAGE_WRITE
  )

  const {
    data: lifecycle,
    error,
    isPending,
    isError,
    isSuccess,
  } = useQuery({
    ...bucketLifecycleQueryOptions({ projectRef, bucketId: bucket.id }),
    enabled: isVisible,
  })
  const rules = lifecycle?.rules ?? []
  const isWritable = canWriteRules(rules)
  const canEditRules = isSuccess && isWritable && canUpdateBuckets

  const { mutate: updateLifecycle, isPending: isUpdating } = useBucketLifecycleUpdateMutation({
    onError: (error) => toast.error(`Failed to update lifecycle rules: ${error.message}`),
  })

  if (!isVisible) return null

  const ruleToDelete = ruleIndexToDelete === null ? undefined : rules[ruleIndexToDelete]
  const isDeletingLastRule = rules.length === 1

  const handleToggleStatus = (index: number, status: LifecycleRuleStatus) => {
    updateLifecycle(
      { projectRef, bucketId: bucket.id, rules: setRuleStatus(rules, index, status) },
      {
        onSuccess: (_data, variables) => {
          track('storage_bucket_lifecycle_rule_updated', {
            ruleStatus: status,
            ruleCount: variables.rules.length,
          })
          toast.success(`Lifecycle rule ${status === 'Enabled' ? 'enabled' : 'disabled'}`)
        },
      }
    )
  }

  const handleDelete = () => {
    if (ruleIndexToDelete === null) return
    updateLifecycle(
      { projectRef, bucketId: bucket.id, rules: removeRule(rules, ruleIndexToDelete) },
      {
        onSuccess: (_data, variables) => {
          track('storage_bucket_lifecycle_rule_removed', { ruleCount: variables.rules.length })
          toast.success('Lifecycle rule deleted')
          setRuleIndexToDelete(null)
        },
      }
    )
  }

  const getEditDisabledReason = () => {
    if (!canUpdateBuckets) return 'You need additional permissions to manage lifecycle rules'
    if (!isWritable) return 'This bucket has rules the dashboard cannot save without losing'
    return undefined
  }
  const editDisabledReason = getEditDisabledReason()

  return (
    <>
      <CardContent className="flex flex-col gap-y-3">
        <div className="flex items-center justify-between gap-x-2">
          <div className="flex flex-col gap-y-0.5">
            <p className="text-sm text-foreground">Lifecycle rules</p>
            <p className="text-sm text-foreground-lighter">
              Expire noncurrent versions of objects in this bucket
            </p>
          </div>
          <ButtonTooltip
            variant="outline"
            icon={<PlusIcon />}
            disabled={!canEditRules}
            onClick={() => setSheetState({ index: null })}
            tooltip={{
              content: {
                side: 'bottom',
                text: canEditRules ? undefined : editDisabledReason,
              },
            }}
          >
            Add rule
          </ButtonTooltip>
        </div>

        {isPending && <ShimmeringLoader className="h-9 py-0" />}

        {isError && (
          <AlertError
            error={error}
            subject="Failed to retrieve lifecycle rules"
            projectRef={projectRef}
          />
        )}

        {isSuccess && !isWritable && (
          <Admonition
            type="default"
            title="Some rules can't be edited here"
            description="This bucket has rules with actions or statuses the dashboard doesn't support. Saving from here would remove them, so manage these rules through the Storage API."
          />
        )}

        {isSuccess && rules.length === 0 && (
          <p className="text-sm text-foreground-lighter">
            No lifecycle rules yet. Noncurrent versions are kept until you delete them.
          </p>
        )}
      </CardContent>

      {isSuccess && rules.length > 0 && (
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[28%]">
                  <code className="text-xs">id</code>
                </TableHead>
                <TableHead className="w-[14%]">
                  <code className="text-xs">status</code>
                </TableHead>
                <TableHead className="w-[14%]">
                  <code className="text-xs">filter</code>
                </TableHead>
                <TableHead className="w-[18%]">
                  <code className="text-xs">noncurrent_days</code>
                </TableHead>
                <TableHead className="w-[20%]">
                  <code className="text-xs">newer_noncurrent_versions</code>
                </TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule, index) => (
                <LifecycleRuleRow
                  key={rule.id ?? index}
                  rule={rule}
                  canEdit={canEditRules && !isUpdating}
                  editDisabledReason={editDisabledReason}
                  onEdit={() => setSheetState({ index })}
                  onToggleStatus={(status) => handleToggleStatus(index, status)}
                  onDelete={() => setRuleIndexToDelete(index)}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}

      {sheetState !== null && (
        <LifecycleRuleSheet
          projectRef={projectRef}
          bucket={bucket}
          rules={rules}
          index={sheetState.index}
          onClose={() => setSheetState(null)}
        />
      )}

      <ConfirmationModal
        visible={ruleToDelete !== undefined}
        variant="destructive"
        title="Delete lifecycle rule"
        confirmLabel="Delete rule"
        confirmLabelLoading="Deleting rule..."
        loading={isUpdating}
        onCancel={() => setRuleIndexToDelete(null)}
        onConfirm={handleDelete}
      >
        <div className="flex flex-col gap-y-2 text-sm text-foreground-light">
          <p>
            {ruleToDelete?.id ? (
              <>
                Delete <code className="text-xs">{ruleToDelete.id}</code> from{' '}
              </>
            ) : (
              'Delete this rule from '
            )}
            <span className="text-foreground">{bucket.name}</span>?
          </p>
          {ruleToDelete !== undefined && (
            <p className="text-foreground-lighter">{describeRule(ruleToDelete)}</p>
          )}
          <p>
            {isDeletingLastRule
              ? 'This is the only rule, so the bucket’s lifecycle configuration will be removed. Noncurrent versions will be kept until you delete them.'
              : 'The remaining rules are saved again unchanged.'}
          </p>
        </div>
      </ConfirmationModal>
    </>
  )
}
