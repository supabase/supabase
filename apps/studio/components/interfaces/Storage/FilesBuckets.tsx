import { Edit, FolderOpen, MoreVertical, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useParams } from 'common'
import { ScaffoldSection } from 'components/layouts/Scaffold'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { Bucket, useBucketsQuery } from 'data/storage/buckets-query'
import { useStoragePolicyCounts } from 'hooks/storage/useStoragePolicyCounts'
import { IS_PLATFORM } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { CreateBucketModal } from './CreateBucketModal'
import { DeleteBucketModal } from './DeleteBucketModal'
import { EditBucketModal } from './EditBucketModal'
import { EmptyBucketModal } from './EmptyBucketModal'
import { EmptyBucketState } from './EmptyBucketState'

type BucketsTableProps = {
  buckets: Bucket[]
  projectRef: string
  filterString: string
  formattedGlobalUploadLimit: string
  setSelectedBucket: (bucket: Bucket) => void
  setModal: (modal: 'edit' | 'empty' | 'delete' | null) => void
  getPolicyCount: (bucketName: string) => number
}

const BucketsTable = ({
  buckets,
  projectRef,
  filterString,
  formattedGlobalUploadLimit,
  setSelectedBucket,
  setModal,
  getPolicyCount,
}: BucketsTableProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: buckets.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 59,
    getItemKey: (index) => buckets[index].id,
  })

  const visibleRows = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  const paddingTop = visibleRows.length > 0 ? visibleRows[0].start : 0
  const paddingBottom =
    visibleRows.length > 0 ? totalSize - visibleRows[visibleRows.length - 1].end : 0

  return (
    <div ref={scrollContainerRef} className="h-full overflow-auto">
      <Table containerProps={{ className: 'overflow-visible' }}>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky top-0 z-10 bg">Name</TableHead>
            <TableHead className="sticky top-0 z-10 bg">Policies</TableHead>
            <TableHead className="sticky top-0 z-10 bg">File size limit</TableHead>
            <TableHead className="sticky top-0 z-10 bg">Allowed MIME types</TableHead>
            <TableHead className="sticky top-0 z-10 bg">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paddingTop > 0 && (
            <TableRow aria-hidden="true" style={{ height: paddingTop }}>
              <TableCell colSpan={5} className="p-0" />
            </TableRow>
          )}
          {buckets.length === 0 && filterString.length > 0 && (
            <TableRow className="[&>td]:hover:bg-inherit">
              <TableCell colSpan={3}>
                <p className="text-sm text-foreground">No results found</p>
                <p className="text-sm text-foreground-light">
                  Your search for "{filterString}" did not return any results
                </p>
              </TableCell>
            </TableRow>
          )}
          {visibleRows.map((virtualRow) => {
            const bucket = buckets[virtualRow.index]

            return (
              <TableRow
                key={bucket.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <p className="text-foreground">{bucket.name}</p>
                    {bucket.public && <Badge variant="warning">Public</Badge>}
                  </div>
                </TableCell>

                <TableCell>
                  <p className="text-foreground-light">{getPolicyCount(bucket.name)}</p>
                </TableCell>

                <TableCell>
                  <p
                    className={
                      bucket.file_size_limit ? 'text-foreground-light' : 'text-foreground-muted'
                    }
                  >
                    {bucket.file_size_limit
                      ? formatBytes(bucket.file_size_limit)
                      : `Unset (${formattedGlobalUploadLimit})`}
                  </p>
                </TableCell>

                <TableCell>
                  <p
                    className={
                      bucket.allowed_mime_types ? 'text-foreground-light' : 'text-foreground-muted'
                    }
                  >
                    {bucket.allowed_mime_types ? bucket.allowed_mime_types.join(', ') : 'Any'}
                  </p>
                </TableCell>

                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button asChild type="default">
                      <Link
                        href={`/project/${projectRef}/storage/files/buckets/${encodeURIComponent(bucket.id)}`}
                      >
                        View files
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="default" className="px-1" icon={<MoreVertical />} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="bottom" align="end" className="w-40">
                        <DropdownMenuItem
                          className="flex items-center space-x-2"
                          onClick={() => {
                            setModal('edit')
                            setSelectedBucket(bucket)
                          }}
                        >
                          <Edit size={12} />
                          <p>Edit bucket</p>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="flex items-center space-x-2"
                          onClick={(e) => {
                            setModal('empty')
                            setSelectedBucket(bucket)
                          }}
                        >
                          <FolderOpen size={12} />
                          <p>Empty bucket</p>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="flex items-center space-x-2"
                          onClick={(e) => {
                            setModal('delete')
                            setSelectedBucket(bucket)
                          }}
                        >
                          <Trash2 size={12} />
                          <p>Delete bucket</p>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
          {paddingBottom > 0 && (
            <TableRow aria-hidden="true" style={{ height: paddingBottom }}>
              <TableCell colSpan={5} className="p-0" />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export const FilesBuckets = () => {
  const { ref } = useParams()

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
        : bucket.name.toLowerCase().includes(filterString.toLowerCase())
    )
  return (
    <>
      {!isLoading &&
      buckets.filter((bucket) => !('type' in bucket) || bucket.type === 'STANDARD').length === 0 ? (
        <EmptyBucketState bucketType="files" />
      ) : (
        // Add !pt-8 to override the default first:pt-12
        <ScaffoldSection isFullWidth className="h-full gap-y-4">
          <div className="flex flex-grow justify-between gap-x-2 items-center">
            <Input
              size="tiny"
              className="flex-grow lg:flex-grow-0 w-52"
              placeholder="Search for a bucket"
              value={filterString}
              onChange={(e) => setFilterString(e.target.value)}
              icon={<Search size={12} />}
            />
            <CreateBucketModal buttonType="primary" buttonClassName="w-fit" />
          </div>

          {isLoading ? (
            <GenericSkeletonLoader />
          ) : (
            <Card>
              <BucketsTable
                buckets={filesBuckets}
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
