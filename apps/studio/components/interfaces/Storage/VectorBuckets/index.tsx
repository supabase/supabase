import { ChevronRight, ExternalLink, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type KeyboardEvent, type MouseEvent } from 'react'

import { useParams } from 'common'
import { ScaffoldHeader, ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useVectorBucketsQuery } from 'data/storage/vector-buckets-query'
import { Bucket as BucketIcon } from 'icons'
import { BASE_PATH } from 'lib/constants'
import {
  Badge,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import { EmptyBucketState } from '../EmptyBucketState'
import { CreateVectorBucketDialog } from './CreateVectorBucketDialog'

/**
 * [Joshen] Low-priority refactor: We should use a virtualized table here as per how we do it
 * for the files buckets for consistency. Not pressing, just an optimization area.
 */

export const VectorsBuckets = () => {
  const { ref: projectRef } = useParams()
  const router = useRouter()

  const [filterString, setFilterString] = useState('')

  const { data, isLoading: isLoadingBuckets } = useVectorBucketsQuery({ projectRef })
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
      window.open(url, '_blank')
    } else {
      router.push(url)
    }
  }

  return (
    <ScaffoldSection isFullWidth>
      <Admonition showIcon={false} type="tip" className="relative mb-6 overflow-hidden">
        <div className="absolute -inset-16 z-0 opacity-50">
          <img
            src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
            alt="Supabase Grafana"
            className="w-full h-full object-cover object-right hidden dark:block"
          />
          <img
            src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
            alt="Supabase Grafana"
            className="w-full h-full object-cover object-right dark:hidden"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-y-2 md:gap-x-8 justify-between px-2 py-1">
          <div className="flex flex-col gap-y-0.5">
            <div className="flex flex-col gap-y-2 items-start">
              <Badge variant="success" className="-ml-0.5 uppercase">
                New
              </Badge>
              <p className="text-sm font-medium">Introducing vector buckets</p>
            </div>
            <p className="text-sm text-foreground-lighter text-balance">
              Vector buckets are now in private alpha. Expect rapid changes, limited features, and
              possible breaking updates. Please share feedback as we refine the experience and
              expand access.
            </p>
          </div>
          <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />} className="mt-2">
            <Link
              // [Joshen] To update with Vector specific GH discussion
              href="https://github.com/orgs/supabase/discussions/40116"
              target="_blank"
              rel="noopener noreferrer"
            >
              Share feedback
            </Link>
          </Button>
        </div>
      </Admonition>

      {!isLoadingBuckets && bucketsList.length === 0 ? (
        <EmptyBucketState bucketType="vectors" />
      ) : (
        <div className="flex flex-col gap-y-4">
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
                          <BucketIcon size={16} className="text-foreground-muted" />
                        </TableCell>
                        <TableCell>
                          <p className="whitespace-nowrap max-w-[512px] truncate">{name}</p>
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
                            <ChevronRight size={14} className="text-foreground-muted/60" />
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
    </ScaffoldSection>
  )
}
