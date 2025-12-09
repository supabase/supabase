import { ChevronRight, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useState, type KeyboardEvent, type MouseEvent } from 'react'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { AlphaNotice } from 'components/ui/AlphaNotice'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useVectorBucketsQuery } from 'data/storage/vector-buckets-query'
import { VectorBucket as VectorBucketIcon } from 'icons'
import { BASE_PATH } from 'lib/constants'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent, PageSectionTitle } from 'ui-patterns/PageSection'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import { EmptyBucketState } from '../EmptyBucketState'
import { CreateBucketButton } from '../NewBucketButton'
import { CreateVectorBucketDialog } from './CreateVectorBucketDialog'

/**
 * [Joshen] Low-priority refactor: We should use a virtualized table here as per how we do it
 * for the files buckets for consistency. Not pressing, just an optimization area.
 */

export const VectorsBuckets = () => {
  const { ref: projectRef } = useParams()
  const router = useRouter()

  const [filterString, setFilterString] = useState('')
  const [visible, setVisible] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const {
    data,
    error: bucketsError,
    isError: isErrorBuckets,
    isLoading: isLoadingBuckets,
    isSuccess: isSuccessBuckets,
  } = useVectorBucketsQuery({ projectRef })
  const bucketsList = data?.vectorBuckets ?? []

  const filteredBuckets =
    filterString.length === 0
      ? bucketsList
      : bucketsList.filter((bucket) =>
          bucket.vectorBucketName.toLowerCase().includes(filterString.toLowerCase())
        )

  const handleBucketNavigation = (bucketName: string, event: MouseEvent | KeyboardEvent) => {
    const url = `/project/${projectRef}/storage/vectors/buckets/${encodeURIComponent(bucketName)}`
    if (event.metaKey || event.ctrlKey) {
      window.open(`${BASE_PATH}${url}`, '_blank')
    } else {
      router.push(url)
    }
  }

  return (
    <>
      <PageContainer>
        <PageSection>
          <PageSectionContent>
            <AlphaNotice
              entity="Vector buckets"
              feedbackUrl="https://github.com/orgs/supabase/discussions/40815"
            />

            {isLoadingBuckets && <GenericSkeletonLoader />}

            {isErrorBuckets && (
              <AlertError error={bucketsError} subject="Failed to retrieve vector buckets" />
            )}

            {isSuccessBuckets && (
              <>
                {bucketsList.length === 0 ? (
                  <EmptyBucketState bucketType="vectors" onCreateBucket={() => setVisible(true)} />
                ) : (
                  <div className="flex flex-col gap-y-4">
                    <div className="py-0">
                      <PageSectionTitle>Buckets</PageSectionTitle>
                    </div>
                    <div className="flex flex-grow justify-between gap-x-2 items-center">
                      <Input
                        size="tiny"
                        className="flex-grow lg:flex-grow-0 w-52"
                        placeholder="Search for a bucket"
                        value={filterString}
                        onChange={(e) => setFilterString(e.target.value)}
                        icon={<Search />}
                      />

                      <CreateBucketButton onClick={() => setVisible(true)} />
                    </div>

                    {isLoadingBuckets ? (
                      <GenericSkeletonLoader />
                    ) : (
                      <Card>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {filteredBuckets.length > 0 && (
                                <TableHead className="w-2 pr-1">
                                  <span className="sr-only">Icon</span>
                                </TableHead>
                              )}
                              <TableHead>Name</TableHead>
                              <TableHead>Created at</TableHead>
                              <TableHead>
                                <span className="sr-only">Actions</span>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredBuckets.length === 0 && filterString.length > 0 && (
                              <TableRow className="[&>td]:hover:bg-inherit">
                                <TableCell colSpan={3}>
                                  <p className="text-sm text-foreground">No results found</p>
                                  <p className="text-sm text-foreground-lighter">
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
                                <TableRow
                                  key={id}
                                  className="relative cursor-pointer h-16 inset-focus"
                                  onClick={(event) => handleBucketNavigation(name, event)}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                      event.preventDefault()
                                      handleBucketNavigation(name, event)
                                    }
                                  }}
                                  tabIndex={0}
                                >
                                  <TableCell className="w-2 pr-1">
                                    <VectorBucketIcon size={16} className="text-foreground-muted" />
                                  </TableCell>
                                  <TableCell>
                                    <p className="whitespace-nowrap max-w-[512px] truncate">
                                      {name}
                                    </p>
                                  </TableCell>
                                  <TableCell>
                                    <p className="text-foreground-light">
                                      <TimestampInfo
                                        utcTimestamp={created}
                                        className="text-sm text-foreground-light"
                                      />
                                    </p>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex justify-end items-center h-full">
                                      <ChevronRight
                                        size={14}
                                        className="text-foreground-muted/60"
                                      />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>
      <CreateVectorBucketDialog visible={visible} setVisible={setVisible} />
    </>
  )
}
