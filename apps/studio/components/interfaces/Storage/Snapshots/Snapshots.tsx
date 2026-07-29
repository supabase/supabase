import { useParams } from 'common'
import { Camera } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { Button, Card } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { StorageBucketSelector } from '../StorageBucketSelector'
import { RestoreSnapshotModal } from './RestoreSnapshotModal'
import { SnapshotsList } from './SnapshotsList'
import { TakeSnapshotModal } from './TakeSnapshotModal'
import { AlertError } from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { useRestorePointPolicyQuery } from '@/data/restore-points/restore-points-query'
import { usePaginatedBucketsQuery } from '@/data/storage/buckets-query'
import { useBucketSnapshotsQuery } from '@/data/storage/protection/bucket-snapshots-query'
import { type BucketSnapshot } from '@/data/storage/protection/protection-mocks'

interface SnapshotsProps {
  /**
   * When set, the bucket is fixed to this value (embedded in a bucket view) —
   * the bucket selector is hidden and the `?bucket=` query param is ignored.
   */
  bucketId?: string
}

export const Snapshots = ({ bucketId }: SnapshotsProps = {}) => {
  const { ref } = useParams()
  const isBucketFixed = bucketId !== undefined

  const [bucketParam, setBucketParam] = useQueryState('bucket', parseAsString)
  const { data: bucketsData } = usePaginatedBucketsQuery(
    { projectRef: ref },
    { enabled: !isBucketFixed }
  )
  const firstBucket = useMemo(() => {
    const buckets = bucketsData?.pages.flatMap((page) => page) ?? []
    return buckets.find((bucket) => !('type' in bucket) || bucket.type === 'STANDARD')?.name
  }, [bucketsData])

  const selectedBucket = bucketId ?? bucketParam ?? firstBucket ?? undefined

  const { data: policy } = useRestorePointPolicyQuery({ projectRef: ref })

  const [showTakeSnapshot, setShowTakeSnapshot] = useState(false)
  const [snapshotToRestore, setSnapshotToRestore] = useState<BucketSnapshot>()

  const {
    data: snapshots,
    isPending,
    isError,
    error,
    isSuccess,
  } = useBucketSnapshotsQuery({ projectRef: ref, bucketId: selectedBucket })

  return (
    <>
      <PageContainer>
        <PageSection>
          <PageSectionContent className="flex flex-col gap-y-4">
            <div className="flex items-center justify-between gap-x-2">
              <div className="flex items-center gap-x-3">
                {!isBucketFixed && (
                  <StorageBucketSelector
                    projectRef={ref}
                    value={selectedBucket}
                    onChange={setBucketParam}
                  />
                )}
                {selectedBucket && (
                  <p className="text-sm text-foreground-lighter">
                    {isBucketFixed
                      ? 'Restore this bucket to a previous point in time'
                      : `Restore ${selectedBucket} to a previous point in time`}
                  </p>
                )}
              </div>
              <Button
                icon={<Camera />}
                disabled={!selectedBucket}
                onClick={() => setShowTakeSnapshot(true)}
              >
                Take snapshot
              </Button>
            </div>

            {isPending && <GenericSkeletonLoader />}
            {isError && <AlertError error={error} subject="Failed to retrieve snapshots" />}
            {isSuccess && snapshots.length === 0 && (
              <Admonition
                type="default"
                title="No snapshots yet"
                description="Take a snapshot manually, or include this bucket in the project's snapshot lifecycle to capture one automatically before each database backup."
              />
            )}
            {isSuccess && snapshots.length > 0 && (
              <>
                <Card className="overflow-hidden">
                  <SnapshotsList snapshots={snapshots} onRestore={setSnapshotToRestore} />
                </Card>
                {policy && (
                  <p className="text-sm text-foreground-lighter">
                    Snapshots are kept for {policy.retentionDays} days, per the project&apos;s{' '}
                    <InlineLink href={`/project/${ref}/storage/files/settings`}>
                      snapshot lifecycle policy
                    </InlineLink>
                    .
                  </p>
                )}
              </>
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>

      <TakeSnapshotModal
        visible={showTakeSnapshot}
        projectRef={ref}
        bucketId={selectedBucket}
        onClose={() => setShowTakeSnapshot(false)}
      />
      <RestoreSnapshotModal
        projectRef={ref}
        bucketId={selectedBucket}
        snapshot={snapshotToRestore}
        onClose={() => setSnapshotToRestore(undefined)}
      />
    </>
  )
}
