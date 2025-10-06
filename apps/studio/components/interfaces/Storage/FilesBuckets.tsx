import { Edit, FolderOpen, MoreVertical, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { useParams } from 'common'
import { ScaffoldSection } from 'components/layouts/Scaffold'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { Bucket, useBucketsQuery } from 'data/storage/buckets-query'
import {
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
  const { ref } = useParams()

  const [modal, setModal] = useState<'edit' | 'empty' | 'delete' | null>(null)
  const [selectedBucket, setSelectedBucket] = useState<Bucket>()
  const [filterString, setFilterString] = useState('')

  const { data: buckets = [], isLoading } = useBucketsQuery({ projectRef: ref })
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
                    <TableHead>Visibility</TableHead>
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
                    <TableRow key={bucket.id}>
                      <TableCell>
                        <p className="text-foreground">{bucket.name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-foreground-light">
                          {bucket.public ? 'Public' : 'Private'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button type="default" onClick={() => {}}>
                            View files
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
                                onClick={() => {
                                  setModal('empty')
                                  setSelectedBucket(bucket)
                                }}
                              >
                                <FolderOpen size={12} />
                                <p>Empty bucket</p>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="flex items-center space-x-2"
                                onClick={() => {
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
