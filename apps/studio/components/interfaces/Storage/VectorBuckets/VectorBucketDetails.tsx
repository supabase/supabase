import { Eye, MoreVertical, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import { DatabaseExtension } from 'data/database-extensions/database-extensions-query'
import { useSchemaCreateMutation } from 'data/database/schema-create-mutation'
import { useS3VectorsWrapperCreateMutation } from 'data/storage/s3-vectors-wrapper-create-mutation'
import { useVectorBucketQuery } from 'data/storage/vector-bucket-query'
import {
  useVectorBucketsIndexesQuery,
  VectorBucketIndex,
} from 'data/storage/vector-buckets-indexes-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
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
import { Admonition } from 'ui-patterns/admonition'
import { CreateVectorTableSheet } from './CreateVectorTableSheet'
import { DeleteVectorBucketModal } from './DeleteVectorBucketModal'
import { DeleteVectorTableModal } from './DeleteVectorTableModal'
import { getVectorBucketFDWSchemaName } from './VectorBuckets.utils'
import { useS3VectorsWrapperExtension } from './useS3VectorsWrapper'
import { useS3VectorsWrapperInstance } from './useS3VectorsWrapperInstance'
import { useSelectedVectorBucket } from './useSelectedVectorBuckets'

export const VectorBucketDetails = () => {
  const router = useRouter()
  const { ref: projectRef, bucketId } = useParams()
  // [Joshen] Use the list buckets to verify that the bucket exists first before fetching bucket details
  const { data: _bucket, isSuccess } = useSelectedVectorBucket()

  const [filterString, setFilterString] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTableToDelete, setSelectedTableToDelete] = useState<VectorBucketIndex>()

  const {
    data: bucket,
    error: bucketError,
    isSuccess: isSuccessBucket,
    isError: isErrorBucket,
  } = useVectorBucketQuery(
    { projectRef, vectorBucketName: bucketId },
    { enabled: isSuccess && !!_bucket }
  )

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

  const { extension: wrappersExtension, state: extensionState } = useS3VectorsWrapperExtension()
  const {
    data: wrapperInstance,
    meta: wrapperMeta,
    isLoading: isLoadingWrapper,
  } = useS3VectorsWrapperInstance({
    bucketId,
  })

  const isLoading = isLoadingIndexes || isLoadingWrapper

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
                icon={<Search size={12} />}
                className="w-48"
              />
              <CreateVectorTableSheet bucketName={bucket?.vectorBucketName} />
            </div>

            {state === 'not-installed' && (
              <ExtensionNotInstalled
                bucketName={bucket?.vectorBucketName}
                projectRef={projectRef!}
                wrapperMeta={wrapperMeta!}
                wrappersExtension={wrappersExtension!}
              />
            )}
            {state === 'needs-upgrade' && (
              <ExtensionNeedsUpgrade
                bucketName={bucket?.vectorBucketName}
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
                                {wrapperInstance ? (
                                  <Button
                                    asChild
                                    icon={<Eye size={14} className="text-foreground-lighter" />}
                                    type="default"
                                  >
                                    {/* TODO: Proper URL for table editor */}
                                    <Link
                                      href={`/project/${projectRef}/editor/${encodeURIComponent(name)}?schema=${getVectorBucketFDWSchemaName(bucketId!)}`}
                                    >
                                      Table Editor
                                    </Link>
                                  </Button>
                                ) : null}
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

const ExtensionNotInstalled = ({
  bucketName,
  projectRef,
  wrapperMeta,
  wrappersExtension,
}: {
  bucketName?: string
  projectRef: string
  wrapperMeta: WrapperMeta
  wrappersExtension: DatabaseExtension
}) => {
  const databaseNeedsUpgrading =
    (wrappersExtension?.default_version ?? '') < (wrapperMeta.minimumExtensionVersion ?? '')

  return (
    <ScaffoldSection isFullWidth>
      <Admonition type="warning" title="Missing required extension" className="mb-0">
        <p>
          The Wrappers extension is required in order to query vector tables.{' '}
          {databaseNeedsUpgrading &&
            'Please first upgrade your database and then install the extension.'}{' '}
          <InlineLink
            href={`${DOCS_URL}/guides/database/extensions/wrappers/s3_vectors`}
            target="_blank"
          >
            Learn more
          </InlineLink>
        </p>
        <Button type="default" asChild className="mt-2">
          <Link
            href={
              databaseNeedsUpgrading
                ? `/project/${projectRef}/settings/infrastructure`
                : `/project/${projectRef}/database/extensions?filter=wrappers`
            }
          >
            {databaseNeedsUpgrading ? 'Upgrade database' : 'Install extension'}
          </Link>
        </Button>
      </Admonition>
    </ScaffoldSection>
  )
}

const ExtensionNeedsUpgrade = ({
  bucketName,
  projectRef,
  wrapperMeta,
  wrappersExtension,
}: {
  bucketName?: string
  projectRef: string
  wrapperMeta: WrapperMeta
  wrappersExtension: DatabaseExtension
}) => {
  // [Joshen] Default version is what's on the DB, so if the installed version is already the default version
  // but still doesnt meet the minimum extension version, then DB upgrade is required
  const databaseNeedsUpgrading =
    wrappersExtension?.installed_version === wrappersExtension?.default_version

  return (
    <ScaffoldSection isFullWidth>
      <Admonition type="warning" title="Outdated extension version" className="mb-0">
        <p>
          The {wrapperMeta.label} wrapper requires a minimum extension version of{' '}
          {wrapperMeta.minimumExtensionVersion}. You have version{' '}
          {wrappersExtension?.installed_version} installed. Please{' '}
          {databaseNeedsUpgrading && 'first upgrade your database, and then '}update the extension
          by disabling and enabling the Wrappers extension.
        </p>
        <p>
          Before reinstalling the wrapper extension, you must first remove all existing wrappers.
          Afterward, you can recreate the wrappers.
        </p>
        <Button asChild type="default">
          <Link
            href={
              databaseNeedsUpgrading
                ? `/project/${projectRef}/settings/infrastructure`
                : `/project/${projectRef}/database/extensions?filter=wrappers`
            }
          >
            {databaseNeedsUpgrading ? 'Upgrade database' : 'Extensions'}
          </Link>
        </Button>
      </Admonition>
    </ScaffoldSection>
  )
}

const WrapperMissing = ({ bucketName }: { bucketName?: string }) => {
  const { data: project } = useSelectedProjectQuery()
  const { mutateAsync: createS3VectorsWrapper, isLoading: isCreatingS3VectorsWrapper } =
    useS3VectorsWrapperCreateMutation()
  const { mutateAsync: createSchema, isLoading: isCreatingSchema } = useSchemaCreateMutation()

  const onSetupWrapper = async () => {
    if (!bucketName) return console.error('Bucket name is required')
    try {
      await createS3VectorsWrapper({ bucketName })
      await createSchema({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        name: getVectorBucketFDWSchemaName(bucketName),
      })
    } catch (error) {
      toast.error(
        `Failed to install wrapper: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const isLoading = isCreatingS3VectorsWrapper || isCreatingSchema

  return (
    <ScaffoldSection isFullWidth>
      <Admonition type="warning" title="Missing integration" className="mb-0">
        <p>The S3 Vectors Wrapper integration is required in order to query vector tables.</p>
        <Button type="default" loading={isLoading} onClick={onSetupWrapper}>
          Install wrapper
        </Button>
      </Admonition>
    </ScaffoldSection>
  )
}
