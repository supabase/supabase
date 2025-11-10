import { ArrowDownNarrowWide, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useParams } from 'common'
import { ScaffoldSection } from 'components/layouts/Scaffold'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { Bucket, useBucketsQuery } from 'data/storage/buckets-query'
import { useStoragePolicyCounts } from 'hooks/storage/useStoragePolicyCounts'
import { IS_PLATFORM } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { CreateBucketModal } from '../CreateBucketModal'
import { DeleteBucketModal } from '../DeleteBucketModal'
import { EditBucketModal } from '../EditBucketModal'
import { EmptyBucketModal } from '../EmptyBucketModal'
import { EmptyBucketState } from '../EmptyBucketState'
import { STORAGE_BUCKET_SORT } from '../Storage.constants'
import { BucketsTable } from './BucketsTable'

export const FilesBuckets = () => {
  const { ref } = useParams()
  const snap = useStorageExplorerStateSnapshot()

  const [modal, setModal] = useState<'edit' | 'empty' | 'delete' | null>(null)
  const [selectedBucket, setSelectedBucket] = useState<Bucket>()
  const [filterString, setFilterString] = useState('')

  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { data: buckets = [], isLoading: isLoadingBuckets } = useBucketsQuery({ projectRef: ref })
  const { getPolicyCount, isLoading: isLoadingPolicies } = useStoragePolicyCounts(buckets)

  const formattedGlobalUploadLimit = formatBytes(data?.fileSizeLimit ?? 0)

  const isLoading = isLoadingBuckets || isLoadingPolicies
  const filesBuckets = buckets
    .filter((bucket) => !('type' in bucket) || bucket.type === 'STANDARD')
    .filter((bucket) =>
      filterString.length === 0
        ? true
        : bucket.id.toLowerCase().includes(filterString.toLowerCase())
    )

  const sortedFilesBuckets = useMemo(
    () =>
      snap.sortBucket === 'alphabetical'
        ? filesBuckets.sort((a, b) =>
            a.id.toLowerCase().trim().localeCompare(b.id.toLowerCase().trim())
          )
        : filesBuckets.sort((a, b) => (new Date(b.created_at) > new Date(a.created_at) ? 1 : -1)),
    [filesBuckets, snap.sortBucket]
  )

  return (
    <>
      {!isLoading &&
      buckets.filter((bucket) => !('type' in bucket) || bucket.type === 'STANDARD').length === 0 ? (
        <EmptyBucketState bucketType="files" className="mt-12" />
      ) : (
        <ScaffoldSection isFullWidth className="h-full gap-y-4">
          <div className="flex flex-grow justify-between gap-x-2 items-center">
            <div className="flex items-center gap-x-2">
              <Input
                size="tiny"
                className="flex-grow lg:flex-grow-0 w-52"
                placeholder="Search for a bucket"
                value={filterString}
                onChange={(e) => setFilterString(e.target.value)}
                icon={<Search size={12} />}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="default" icon={<ArrowDownNarrowWide />}>
                    Sorted by {snap.sortBucket === 'alphabetical' ? 'name' : 'created at'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuRadioGroup
                    value={snap.sortBucket}
                    onValueChange={(value) => snap.setSortBucket(value as STORAGE_BUCKET_SORT)}
                  >
                    <DropdownMenuRadioItem value="alphabetical">Sort by name</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="created_at">
                      Sort by created at
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CreateBucketModal buttonType="primary" buttonClassName="w-fit" />
          </div>

          {isLoading ? (
            <GenericSkeletonLoader />
          ) : (
            <Card>
              <BucketsTable
                buckets={sortedFilesBuckets}
                projectRef={ref ?? '_'}
                filterString={filterString}
                formattedGlobalUploadLimit={formattedGlobalUploadLimit}
                setSelectedBucket={setSelectedBucket}
                setModal={setModal}
                getPolicyCount={getPolicyCount}
              />
            </Card>
          )}
        </ScaffoldSection>
      )}

      {selectedBucket && (
        <>
          <EditBucketModal
            visible={modal === 'edit'}
            bucket={selectedBucket}
            onClose={() => setModal(null)}
          />
          <EmptyBucketModal
            visible={modal === 'empty'}
            bucket={selectedBucket}
            onClose={() => setModal(null)}
          />
          <DeleteBucketModal
            visible={modal === `delete`}
            bucket={selectedBucket}
            onClose={() => setModal(null)}
          />
        </>
      )}
    </>
  )
}
