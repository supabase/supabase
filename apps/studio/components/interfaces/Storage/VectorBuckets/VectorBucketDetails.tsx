import { Eye, MoreVertical, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { useVectorBucketQuery } from 'data/storage/vector-bucket-query'
import {
  useVectorBucketsIndexesQuery,
  VectorBucketIndex,
} from 'data/storage/vector-buckets-indexes-query'
import {
  Button,
  Card,
  CardContent,
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
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { CreateVectorTableSheet } from './CreateVectorTableSheet'
import { DeleteVectorBucketModal } from './DeleteVectorBucketModal'
import { DeleteVectorTableModal } from './DeleteVectorTableModal'

export const VectorBucketDetails = () => {
  const router = useRouter()
  const { ref: projectRef, bucketId } = useParams()

  const [filterString, setFilterString] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTableToDelete, setSelectedTableToDelete] = useState<VectorBucketIndex>()

  const {
    data: bucket,
    error: bucketError,
    isSuccess: isSuccessBucket,
    isError: isErrorBucket,
  } = useVectorBucketQuery({ projectRef, vectorBucketName: bucketId })

  const { data, isLoading: isLoadingIndexes } = useVectorBucketsIndexesQuery({
    projectRef,
    vectorBucketName: bucket?.vectorBucketName,
  })
  const allIndexes = data?.indexes ?? []

  const filteredList =
    filterString.length === 0
      ? allIndexes
      : allIndexes.filter((index) =>
          index.indexName.toLowerCase().includes(filterString.toLowerCase())
        )

  return (
    <>
      {isErrorBucket ? (
        <ScaffoldContainer bottomPadding>
          <ScaffoldSection isFullWidth>
            <AlertError subject="Failed to fetch vector buckets" error={bucketError} />
          </ScaffoldSection>
        </ScaffoldContainer>
      ) : (
        <ScaffoldContainer bottomPadding>
          <ScaffoldSection isFullWidth className="gap-y-4">
            <ScaffoldHeader className="pt-0 pb-3">
              <ScaffoldSectionTitle>Tables</ScaffoldSectionTitle>
              <ScaffoldSectionDescription>
                Vector tables stored in this bucket.
              </ScaffoldSectionDescription>
            </ScaffoldHeader>
            <div className="flex flex-row justify-between">
              <Input
                size="tiny"
                placeholder="Search for a table"
                value={filterString}
                onChange={(e) => setFilterString(e.target.value)}
                icon={<Search size={12} />}
                className="w-48"
              />
              <CreateVectorTableSheet bucketName={bucket?.vectorBucketName} />
            </div>

            {isLoadingIndexes ? (
              <GenericSkeletonLoader />
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className={filteredList.length === 0 ? 'text-foreground-muted' : undefined}
                      >
                        Name
                      </TableHead>
                      <TableHead
                        className={filteredList.length === 0 ? 'text-foreground-muted' : undefined}
                      >
                        Dimension
                      </TableHead>
                      <TableHead
                        className={filteredList.length === 0 ? 'text-foreground-muted' : undefined}
                      >
                        Distance metric
                      </TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredList.length === 0 ? (
                      <TableRow className="[&>td]:hover:bg-inherit">
                        <TableCell colSpan={3}>
                          {filterString.length > 0 ? (
                            <>
                              <p className="text-sm text-foreground">No results found</p>
                              <p className="text-sm text-foreground-lighter">
                                Your search for "{filterString}" did not return any results
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-foreground">No tables yet</p>
                              <p className="text-sm text-foreground-lighter">
                                Create your first table to get started
                              </p>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredList.map((index, idx: number) => {
                        const id = `index-${idx}`
                        const name = index.indexName

                        return (
                          <TableRow key={id}>
                            <TableCell>{name}</TableCell>
                            <TableCell>
                              <p className="text-foreground-lighter">{index.dimension}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-foreground-lighter">{index.distanceMetric}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-row justify-end gap-2">
                                <Button
                                  asChild
                                  icon={<Eye size={14} className="text-foreground-lighter" />}
                                  type="default"
                                >
                                  {/* TODO: Proper URL for table editor */}
                                  <Link
                                    href={`/project/${projectRef}/editor/${encodeURIComponent(name)}?schema=${bucketId}`}
                                  >
                                    Table Editor
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
                                        setSelectedTableToDelete(index)
                                      }}
                                    >
                                      <Trash2 size={12} />
                                      <p>Delete table</p>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}
          </ScaffoldSection>

          <ScaffoldSection isFullWidth className="flex flex-col gap-y-4">
            <header>
              <ScaffoldSectionTitle>Manage</ScaffoldSectionTitle>
            </header>
            <Card>
              <CardContent className="flex flex-col md:flex-row md:justify-between gap-y-4 gap-x-8 md:items-center">
                <div className="flex flex-col">
                  <h3>Delete bucket</h3>
                  <p className="text-sm text-foreground-lighter">
                    This will also delete any data in your bucket. Make sure you have a backup if
                    you want to keep your data.
                  </p>
                </div>
                <Button
                  type="danger"
                  disabled={!isSuccessBucket}
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete bucket
                </Button>
              </CardContent>
            </Card>
          </ScaffoldSection>
        </ScaffoldContainer>
      )}

      <DeleteVectorTableModal
        visible={!!selectedTableToDelete}
        table={selectedTableToDelete}
        onClose={() => setSelectedTableToDelete(undefined)}
      />

      <DeleteVectorBucketModal
        visible={showDeleteModal}
        bucketName={bucket?.vectorBucketName}
        onCancel={() => setShowDeleteModal(false)}
        onSuccess={() => {
          setShowDeleteModal(false)
          router.push(`/project/${projectRef}/storage/vectors`)
        }}
      />
    </>
  )
}
