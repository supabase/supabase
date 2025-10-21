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
import { useVectorBucketsIndexesQuery } from 'data/storage/vector-buckets-indexes-query'
import { Eye, MoreVertical, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
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
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import { BUCKET_TYPES } from '../Storage.constants'
import { CreateVectorIndexSheet } from './CreateVectorIndexSheet'

// Mock data for development - remove when backend is ready
const MOCK_VECTOR_INDEXES = [
  {
    indexName: 'documents_index',
    creationTime: '1704067200', // Jan 1, 2024
  },
  {
    indexName: 'embeddings_index',
    creationTime: '1704153600', // Jan 2, 2024
  },
  {
    indexName: 'search_index',
    creationTime: '1704240000', // Jan 3, 2024
  },
]

const MOCK_VECTOR_INDEXES_EMPTY = []

interface VectorBucketDetailsProps {
  bucket: { vectorBucketName: string; creationTime: string }
}

export const VectorBucketDetails = ({ bucket }: VectorBucketDetailsProps) => {
  const { ref: projectRef } = useParams()

  // Use the correct query for bucket contents
  const { data, isLoading, error } = useVectorBucketsIndexesQuery({
    projectRef,
    vectorBucketName: bucket.vectorBucketName,
  })

  // Mock data for development - replace with real data when backend is ready
  // const allIndexes = MOCK_VECTOR_INDEXES
  const allIndexes = data?.vectorBuckets ?? []
  const config = BUCKET_TYPES['vectors']
  const [filterString, setFilterString] = useState('')

  // Filter indexes based on search string
  const indexesList = allIndexes.filter((index) =>
    filterString.length === 0
      ? true
      : index.indexName.toLowerCase().includes(filterString.toLowerCase())
  )

  console.log({ data, bucket, indexesList })

  return (
    <>
      <PageLayout
        title={bucket.vectorBucketName}
        breadcrumbs={[
          {
            label: 'Vectors',
            href: `/project/${projectRef}/storage/vectors`,
          },
        ]}
        secondaryActions={config?.docsUrl ? [<DocsButton key="docs" href={config.docsUrl} />] : []}
      >
        <ScaffoldContainer bottomPadding>
          <ScaffoldSection isFullWidth className="gap-y-4">
            <ScaffoldHeader className="pt-0 pb-3">
              <ScaffoldSectionTitle>Tables</ScaffoldSectionTitle>
              <ScaffoldSectionDescription>
                Vector indexes connected to this bucket.
              </ScaffoldSectionDescription>
            </ScaffoldHeader>
            {allIndexes.length > 0 && (
              <div className="flex flex-row justify-between">
                <Input
                  size="tiny"
                  placeholder="Search for an index"
                  value={filterString}
                  onChange={(e) => setFilterString(e.target.value)}
                  icon={<Search size={12} />}
                  className="w-48"
                />
                <CreateVectorIndexSheet />
              </div>
            )}

            {allIndexes.length > 0 && (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className={indexesList.length === 0 ? 'text-foreground-lighter' : undefined}
                      >
                        Name
                      </TableHead>
                      <TableHead
                        className={indexesList.length === 0 ? 'text-foreground-lighter' : undefined}
                      >
                        Created at
                      </TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indexesList.length === 0 && filterString.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <p className="text-sm text-foreground">No results found</p>
                          <p className="text-sm text-foreground-light">
                            Your search for "{filterString}" did not return any results
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                    {indexesList.map((index, idx: number) => {
                      const id = `index-${idx}`
                      const name = index.indexName
                      // the creation time is in seconds, convert it to milliseconds
                      const created = +index.creationTime * 1000

                      return (
                        <TableRow key={id}>
                          <TableCell>{name}</TableCell>
                          <TableCell>
                            <p className="text-foreground-light">
                              <TimestampInfo utcTimestamp={created} className="text-sm" />
                            </p>
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
                    })}
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
                <Button type="danger" onClick={() => {}}>
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
