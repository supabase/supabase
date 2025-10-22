import { MoreVertical, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ScaffoldHeader, ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useVectorBucketDeleteMutation } from 'data/storage/vector-bucket-delete-mutation'
import { useVectorBucketsQuery } from 'data/storage/vector-buckets-query'
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import { DeleteBucketModal } from '../DeleteBucketModal'
import { EmptyBucketState } from '../EmptyBucketState'
import { CreateVectorBucketDialog } from './CreateVectorBucketDialog'

export const VectorsBuckets = () => {
  const { ref: projectRef } = useParams()
  const router = useRouter()
  const { data, isLoading: isLoadingBuckets } = useVectorBucketsQuery({ projectRef })
  const [filterString, setFilterString] = useState('')
  const [modal, setModal] = useState<{
    bucket: { vectorBucketName: string; creationTime: string }
  } | null>(null)

  const bucketsList = data?.vectorBuckets ?? []

  const filteredBuckets = bucketsList.filter((bucket) =>
    filterString.length === 0
      ? true
      : bucket.vectorBucketName.toLowerCase().includes(filterString.toLowerCase())
  )

  const { mutate: deleteBucket } = useVectorBucketDeleteMutation({
    onSuccess: (data, vars) => {
      toast.success(`Bucket "${vars.bucketName}" deleted successfully`)
      router.push(`/project/${projectRef}/storage/vectors`)
    },
  })

  return (
    <>
      {!isLoadingBuckets && bucketsList.length === 0 ? (
        <EmptyBucketState bucketType="vectors" />
      ) : (
        // Override the default first:pt-12 to match other storage types
        <ScaffoldSection isFullWidth className="gap-y-4 first:pt-8">
          <ScaffoldHeader className="py-0">
            <ScaffoldSectionTitle>Buckets</ScaffoldSectionTitle>
          </ScaffoldHeader>
          <div className="flex flex-grow justify-between gap-x-2 items-center">
            <Input
              size="tiny"
              className="flex-grow lg:flex-grow-0 w-52"
              placeholder="Search for a bucket"
              value={filterString}
              onChange={(e) => setFilterString(e.target.value)}
              icon={<Search size={12} />}
            />
            <CreateVectorBucketDialog />
          </div>

          {isLoadingBuckets ? (
            <GenericSkeletonLoader />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created at</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBuckets.length === 0 && filterString.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <p className="text-sm text-foreground">No results found</p>
                        <p className="text-sm text-foreground-light">
                          Your search for "{filterString}" did not return any results
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredBuckets.map((bucket, idx: number) => {
                    const id = `bucket-${idx}`
                    const name = bucket.vectorBucketName
                    // the creation time is in seconds, convert it to milliseconds
                    const created = +bucket.creationTime * 1000

                    return (
                      <TableRow key={id}>
                        <TableCell>{name}</TableCell>
                        <TableCell>
                          <p className="text-foreground-light">
                            <TimestampInfo
                              utcTimestamp={created}
                              className="text-sm text-foreground-light"
                            />
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button asChild type="default">
                              <Link
                                href={`/project/${projectRef}/storage/vectors/buckets/${encodeURIComponent(name)}`}
                              >
                                View contents
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
                                    setModal({ bucket })
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
                </TableBody>
              </Table>
            </Card>
          )}
        </ScaffoldSection>
      )}

      {modal && (
        <DeleteBucketModal
          visible={true}
          bucket={{
            id: modal.bucket.vectorBucketName,
            name: modal.bucket.vectorBucketName,
            created_at: modal.bucket.creationTime,
            updated_at: modal.bucket.creationTime,
            owner: '',
            public: false,
            type: 'STANDARD' as const,
          }}
          onClose={() => setModal(null)}
          onDelete={() =>
            deleteBucket({ projectRef: projectRef!, bucketName: modal.bucket.vectorBucketName })
          }
        />
      )}
    </>
  )
}
