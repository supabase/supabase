import { useParams } from 'common'
import { Camera } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { Button, Card } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import { usePaginatedBucketsQuery } from '@/data/storage/buckets-query'
import { useBucketSnapshotsQuery } from '@/data/storage/protection/bucket-snapshots-query'
import { type BucketSnapshot } from '@/data/storage/protection/protection-mocks'
import { StorageBucketSelector } from '../StorageBucketSelector'
import { RestoreSnapshotModal } from './RestoreSnapshotModal'
import { SnapshotsList } from './SnapshotsList'
import { TakeSnapshotModal } from './TakeSnapshotModal'

export const Snapshots = () => {
  const { ref } = useParams()

  const [bucketParam, setBucketParam] = useQueryState('bucket', parseAsString)
  const { data: bucketsData } = usePaginatedBucketsQuery({ projectRef: ref })
  const firstBucket = useMemo(() => {
    const buckets = bucketsData?.pages.flatMap((page) => page) ?? []
    return buckets.find((bucket) => !('type' in bucket) || bucket.type === 'STANDARD')?.name
  }, [bucketsData])

  const selectedBucket = bucketParam ?? firstBucket ?? undefined

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
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Snapshots</PageHeaderTitle>
            <PageHeaderDescription>
              {selectedBucket
                ? `Restore ${selectedBucket} to a previous point in time.`
                : 'Restore a bucket to a previous point in time.'}
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <StorageBucketSelector
              projectRef={ref}
              value={selectedBucket}
              onChange={setBucketParam}
            />
            <Button
              icon={<Camera />}
              disabled={!selectedBucket}
              onClick={() => setShowTakeSnapshot(true)}
            >
              Take snapshot
            </Button>
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer>
        <PageSection>
          <PageSectionContent className="gap-y-4">
            {isPending && <GenericSkeletonLoader />}
            {isError && <AlertError error={error} subject="Failed to retrieve snapshots" />}
            {isSuccess && snapshots.length === 0 && (
              <Admonition
                type="default"
                title="No snapshots yet"
                description="Take a snapshot to create a restore point, or enable snapshots on this bucket to capture one before each database backup."
              />
            )}
            {isSuccess && snapshots.length > 0 && (
              <>
                <Card className="overflow-hidden">
                  <SnapshotsList snapshots={snapshots} onRestore={setSnapshotToRestore} />
                </Card>
                <p className="text-sm text-foreground-lighter">
                  Snapshots expire after 90 days per this bucket&apos;s lifecycle policy.
                </p>
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
