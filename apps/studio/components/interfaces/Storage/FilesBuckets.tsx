import { Edit, FolderOpen, MoreVertical, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

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

export const FilesBuckets = () => {
  const router = useRouter()
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
        <ScaffoldSection isFullWidth className="gap-y-4">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Policies</TableHead>
                    <TableHead>File size limit</TableHead>
                    <TableHead>Allowed MIME types</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filesBuckets.length === 0 && filterString.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <p className="text-sm text-foreground">No results found</p>
                        <p className="text-sm text-foreground-light">
                          Your search for "{filterString}" did not return any results
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                  {filesBuckets.map((bucket) => (
                    <TableRow
                      key={bucket.id}
                      className="cursor-pointer"
                      onClick={(event) => {
                        const url = `/project/${ref}/storage/files/buckets/${bucket.id}`
                        if (event.metaKey) window.open(url, '_blank')
                        else router.push(url)
                      }}
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
                            bucket.file_size_limit
                              ? 'text-foreground-light'
                              : 'text-foreground-muted'
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
                            bucket.allowed_mime_types
                              ? 'text-foreground-light'
                              : 'text-foreground-muted'
                          }
                        >
                          {bucket.allowed_mime_types ? bucket.allowed_mime_types.join(', ') : 'Any'}
                        </p>
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button asChild type="default">
                            <Link
                              href={`/project/${ref}/storage/files/buckets/${encodeURIComponent(bucket.id)}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              View files
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="default"
                                className="px-1"
                                icon={<MoreVertical />}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="end" className="w-40">
                              <DropdownMenuItem
                                className="flex items-center space-x-2"
                                onClick={(e) => {
                                  e.stopPropagation()
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
                                  e.stopPropagation()
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
                                  e.stopPropagation()
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
                  ))}
                </TableBody>
              </Table>
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
