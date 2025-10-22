import { Eye, MoreVertical, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { useVectorBucketDeleteMutation } from 'data/storage/vector-bucket-delete-mutation'
import { useVectorBucketIndexDeleteMutation } from 'data/storage/vector-bucket-index-delete-mutation'
import { useVectorBucketsIndexesQuery } from 'data/storage/vector-buckets-indexes-query'
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
import { BUCKET_TYPES } from '../Storage.constants'
import { CreateVectorTableSheet } from './CreateVectorTableSheet'

interface VectorBucketDetailsProps {
  bucket: { vectorBucketName: string; creationTime: string }
}

export const VectorBucketDetails = ({ bucket }: VectorBucketDetailsProps) => {
  const { ref: projectRef } = useParams()
  const router = useRouter()

  // Use the correct query for bucket contents
  const {
    data,
    isLoading: isLoadingIndexes,
    error,
  } = useVectorBucketsIndexesQuery({
    projectRef,
    vectorBucketName: bucket.vectorBucketName,
  })

  const { mutate: deleteIndex } = useVectorBucketIndexDeleteMutation({
    onSuccess: (data, vars) => {
      toast.success(`Table "${data.name}" deleted successfully`)
    },
  })

  const { mutate: deleteBucket } = useVectorBucketDeleteMutation({
    onSuccess: () => {
      toast.success(`Bucket "${bucket.vectorBucketName}" deleted successfully`)
      router.push(`/project/${projectRef}/storage/vectors`)
    },
  })

  const allIndexes = data?.indexes ?? []
  const config = BUCKET_TYPES['vectors']
  const [filterString, setFilterString] = useState('')

  // Filter indexes based on search string
  const filteredList = allIndexes.filter((index) =>
    filterString.length === 0
      ? true
      : index.indexName.toLowerCase().includes(filterString.toLowerCase())
  )

  return (
    <>
      <PageLayout
        title={bucket.vectorBucketName}
        breadcrumbs={[{ label: 'Vectors', href: `/project/${projectRef}/storage/vectors` }]}
        secondaryActions={config?.docsUrl ? [<DocsButton key="docs" href={config.docsUrl} />] : []}
      >
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
              <CreateVectorTableSheet bucketName={bucket.vectorBucketName} />
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
                              <p className="text-sm text-foreground-light">
                                Your search for "{filterString}" did not return any results
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-foreground">No tables yet</p>
                              <p className="text-sm text-foreground-light">
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
                        // the creation time is in seconds, convert it to milliseconds
                        // const created = +index.creationTime * 1000

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
                                    href={`/project/${projectRef}/editor/${encodeURIComponent(name)}`}
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
                                        deleteIndex({
                                          projectRef: projectRef!,
                                          bucketName: bucket.vectorBucketName,
                                          indexName: index.indexName,
                                        })
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
                  onClick={() => {
                    deleteBucket({
                      projectRef: projectRef!,
                      bucketName: bucket.vectorBucketName,
                    })
                  }}
                >
                  Delete bucket
                </Button>
              </CardContent>
            </Card>
          </ScaffoldSection>
        </ScaffoldContainer>
      </PageLayout>
    </>
  )
}
