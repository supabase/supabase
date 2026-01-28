import { MoreVertical, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
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
import { useVectorBucketsIndexesQuery } from 'data/storage/vector-buckets-indexes-query'
import { SqlEditor, TableEditor } from 'icons'
import {
  Button,
  Card,
  CardContent,
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
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { CreateVectorTableSheet } from '../CreateVectorTableSheet'
import { DeleteVectorBucketModal } from '../DeleteVectorBucketModal'
import { DeleteVectorTableModal } from '../DeleteVectorTableModal'
import { useS3VectorsWrapperExtension } from '../useS3VectorsWrapper'
import { useS3VectorsWrapperInstance } from '../useS3VectorsWrapperInstance'
import { useSelectedVectorBucket } from '../useSelectedVectorBuckets'
import { InitializeForeignSchemaDialog } from './InitializeForeignSchemaDialog'
import {
  ExtensionNeedsUpgrade,
  ExtensionNotInstalled,
  WrapperMissing,
} from './VectorBucketCallouts'
import { VectorBucketTableExamplesSheet } from './VectorBucketTableExamplesSheet'

export const VectorBucketDetails = () => {
  const router = useRouter()
  const { ref: projectRef, bucketId } = useParams()
  const { data: _bucket, isSuccess } = useSelectedVectorBucket()

  const [filterString, setFilterString] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useQueryState(
    'delete',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )
  const [_, setSelectedTableIdToDelete] = useQueryState(
    'deleteTable',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )

  const {
    data: bucket,
    error: bucketError,
    isSuccess: isSuccessBucket,
    isError: isErrorBucket,
  } = useVectorBucketQuery(
    { projectRef, vectorBucketName: bucketId },
    { enabled: isSuccess && !!_bucket }
  )

  const { data, isPending: isLoadingIndexes } = useVectorBucketsIndexesQuery({
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

  const { extension: wrappersExtension, state: extensionState } = useS3VectorsWrapperExtension()

  const {
    data: wrapperInstance,
    meta: wrapperMeta,
    isLoading: isLoadingWrapper,
  } = useS3VectorsWrapperInstance({ bucketId })

  const isLoading = isLoadingIndexes || isLoadingWrapper
  const hasSetUpForeignSchema = (wrapperInstance?.server_options ?? []).find((x) =>
    x.startsWith('supabase_target_schema')
  )

  const state = isLoading
    ? 'loading'
    : extensionState === 'installed'
      ? wrapperInstance
        ? 'added'
        : 'missing'
      : extensionState

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
                icon={<Search />}
                className="w-48"
              />
              <div className="flex items-center gap-x-2">
                {!!wrapperInstance && !hasSetUpForeignSchema && <InitializeForeignSchemaDialog />}
                <CreateVectorTableSheet bucketName={bucket?.vectorBucketName} />
              </div>
            </div>

            {state === 'not-installed' && (
              <ExtensionNotInstalled
                projectRef={projectRef!}
                wrapperMeta={wrapperMeta!}
                wrappersExtension={wrappersExtension!}
              />
            )}
            {state === 'needs-upgrade' && (
              <ExtensionNeedsUpgrade
                projectRef={projectRef!}
                wrapperMeta={wrapperMeta!}
                wrappersExtension={wrappersExtension!}
              />
            )}

            {state === 'missing' && <WrapperMissing bucketName={bucket?.vectorBucketName} />}
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

                        const foreignTable = wrapperInstance?.tables?.find(
                          (x) => x.name === index.indexName
                        )

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
                                <VectorBucketTableExamplesSheet index={index} />
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      type="default"
                                      className="w-7"
                                      icon={<MoreVertical />}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent side="bottom" align="end" className="w-40">
                                    {!!foreignTable ? (
                                      <>
                                        <DropdownMenuItem
                                          className="flex items-center space-x-2"
                                          asChild
                                        >
                                          <Link
                                            href={`/project/${projectRef}/sql/new?content=${encodeURIComponent(`select * from "${foreignTable.schema}"."${foreignTable.name}";`)}`}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <SqlEditor
                                              size={12}
                                              className="text-foreground-lighter"
                                            />
                                            <p>Query in SQL Editor</p>
                                          </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="flex items-center space-x-2"
                                          asChild
                                        >
                                          <Link
                                            href={`/project/${projectRef}/editor/${foreignTable.id}?schema=${foreignTable.schema}`}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <TableEditor
                                              size={12}
                                              className="text-foreground-lighter"
                                            />
                                            <p>View in Table Editor</p>
                                          </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                      </>
                                    ) : null}
                                    <DropdownMenuItem
                                      className="flex items-center space-x-2"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedTableIdToDelete(index.indexName)
                                      }}
                                    >
                                      <Trash2 size={12} className="text-foreground-lighter" />
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

      <DeleteVectorTableModal />

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
