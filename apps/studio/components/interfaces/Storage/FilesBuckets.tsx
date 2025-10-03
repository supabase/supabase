import { Edit, FolderOpen, MoreVertical, Trash2 } from 'lucide-react'

import { useParams } from 'common'
import { ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { Bucket, useBucketsQuery } from 'data/storage/buckets-query'
import { useState } from 'react'
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
import { CreateBucketModal } from './CreateBucketModal'
import { DeleteBucketModal } from './DeleteBucketModal'
import { EditBucketModal } from './EditBucketModal'
import { EmptyBucketModal } from './EmptyBucketModal'
import { EmptyBucketState } from './EmptyBucketState'

export const FilesBuckets = () => {
  const { ref } = useParams()

  const [modal, setModal] = useState<'edit' | 'empty' | 'delete' | null>(null)
  const [selectedBucket, setSelectedBucket] = useState<Bucket>()

  const { data: buckets = [] } = useBucketsQuery({ projectRef: ref })
  const filesBuckets = buckets.filter((bucket) => !('type' in bucket) || bucket.type === 'STANDARD')

  return (
    <>
      {filesBuckets.length === 0 ? (
        <EmptyBucketState bucketType="files" />
      ) : (
        <div className="space-y-12">
          <ScaffoldSection>
            <div className="col-span-12">
              <FormHeader
                title="File buckets"
                actions={
                  <CreateBucketModal
                    buttonType="primary"
                    buttonClassName="w-fit"
                    label="New file bucket"
                  />
                }
              />

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
            </div>
          </ScaffoldSection>
        </div>
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
