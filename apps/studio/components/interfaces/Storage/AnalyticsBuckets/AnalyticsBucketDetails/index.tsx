import { uniq } from 'lodash'
import { Loader2, SquarePlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'

import { useParams } from 'common'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import {
  convertKVStringArrayToJson,
  formatWrapperTables,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import {
  DatabaseExtension,
  useDatabaseExtensionsQuery,
} from 'data/database-extensions/database-extensions-query'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useIcebergNamespacesQuery } from 'data/storage/iceberg-namespaces-query'
import { useIcebergWrapperCreateMutation } from 'data/storage/iceberg-wrapper-create-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { Button, Card, CardContent } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns'
import { Admonition } from 'ui-patterns/admonition'
import { GenericTableLoader } from 'ui-patterns/ShimmeringLoader'
import { DeleteAnalyticsBucketModal } from '../DeleteAnalyticsBucketModal'
import { useSelectedAnalyticsBucket } from '../useSelectedAnalyticsBucket'
import { HIDE_REPLICATION_USER_FLOW } from './AnalyticsBucketDetails.constants'
import { BucketHeader } from './BucketHeader'
import { ConnectTablesDialog } from './ConnectTablesDialog'
import { CreateTableInstructions } from './CreateTable/CreateTableInstructions'
import { NamespaceWithTables } from './NamespaceWithTables'
import { SimpleConfigurationDetails } from './SimpleConfigurationDetails'
import { useAnalyticsBucketAssociatedEntities } from './useAnalyticsBucketAssociatedEntities'
import { useIcebergWrapperExtension } from './useIcebergWrapper'

export const AnalyticBucketDetails = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { state: extensionState } = useIcebergWrapperExtension()
  const {
    data: bucket,
    error: bucketError,
    isSuccess: isSuccessBucket,
    isError: isErrorBucket,
  } = useSelectedAnalyticsBucket()

  const [showDeleteModal, setShowDeleteModal] = useQueryState(
    'delete',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )
  // [Joshen] Namespaces are now created asynchronously when the pipeline is started, so long poll after
  // updating connected tables until namespaces are updated
  // Namespace would just be the schema (Which is currently limited to public)
  // Wrapper table would be {schema}_{table}_changelog
  const [pollIntervalNamespaces, setPollIntervalNamespaces] = useState(0)
  const [pollIntervalNamespaceTables, setPollIntervalNamespaceTables] = useState(0)

  const { mutateAsync: startPipeline, isPending: isStartingPipeline } = useStartPipelineMutation()

  const {
    publication,
    pipeline,
    icebergWrapper: wrapperInstance,
    isLoadingWrapperInstance,
  } = useAnalyticsBucketAssociatedEntities({
    projectRef,
    bucketId: bucket?.name,
  })
  const { data, isSuccess: isSuccessPipelineStatus } = useReplicationPipelineStatusQuery(
    { projectRef, pipelineId: pipeline?.id },
    {
      refetchInterval: (data) => {
        if (data?.status.name !== 'started') return 4000
        else return false
      },
    }
  )
  const pipelineStatus = data?.status.name
  const isPipelineRunning = pipelineStatus === 'started'
  const isPipelineStopped = ['failed', 'stopped'].includes(pipelineStatus ?? '')

  const wrapperValues = convertKVStringArrayToJson(wrapperInstance?.server_options ?? [])
  const integration = INTEGRATIONS.find((i) => i.id === 'iceberg_wrapper' && i.type === 'wrapper')
  const wrapperMeta = (integration?.type === 'wrapper' && integration.meta) as WrapperMeta
  const state = isLoadingWrapperInstance
    ? 'loading'
    : extensionState === 'installed'
      ? wrapperInstance
        ? 'added'
        : 'missing'
      : extensionState

  const wrapperTables = useMemo(() => {
    if (!wrapperInstance) return []
    return formatWrapperTables(wrapperInstance, wrapperMeta!)
  }, [wrapperInstance, wrapperMeta])

  const { data: extensionsData } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const wrappersExtension = extensionsData?.find((ext) => ext.name === 'wrappers')

  const {
    data: namespacesData = [],
    isLoading: isLoadingNamespaces,
    isSuccess: isSuccessNamespaces,
  } = useIcebergNamespacesQuery(
    {
      projectRef,
      warehouse: wrapperValues.warehouse,
    },
    {
      refetchInterval: (_data) => {
        const data = _data ?? []
        if (pollIntervalNamespaces === 0) return false

        const publicationTableSchemas = publication?.tables.map((x) => x.schema) ?? []
        const isSynced = !publicationTableSchemas.some((x) => !data.includes(x))
        if (isSynced) {
          setPollIntervalNamespaces(0)
          return false
        }

        return pollIntervalNamespaces
      },
    }
  )

  const publicationTableSchemas = (publication?.tables ?? []).map((x) => x.schema)
  const isSyncedPublicationTableSchemasAndNamespaces = !publicationTableSchemas.some(
    (x) => !namespacesData.includes(x)
  )
  const isPollingForData = pollIntervalNamespaces > 0 || pollIntervalNamespaceTables > 0

  const namespaces = useMemo(() => {
    const fdwNamespaces = wrapperTables.map((t) => t.table.split('.')[0]) as string[]
    const namespaces = uniq([...fdwNamespaces, ...(namespacesData ?? [])])

    return namespaces.map((namespace) => {
      const tables = wrapperTables.filter((t) => t.table.split('.')[0] === namespace)
      const schema = tables[0]?.schema

      return {
        namespace: namespace,
        schema: schema,
        tables: tables,
      }
    })
  }, [wrapperTables, namespacesData])

  useEffect(() => {
    if (isSuccessNamespaces && !isSyncedPublicationTableSchemasAndNamespaces) {
      setPollIntervalNamespaces(4000)
    }
  }, [isSuccessNamespaces, isSyncedPublicationTableSchemasAndNamespaces])

  return (
    <>
      {isErrorBucket ? (
        <ScaffoldContainer bottomPadding>
          <ScaffoldSection isFullWidth>
            <AlertError subject="Failed to fetch analytics buckets" error={bucketError} />
          </ScaffoldSection>
        </ScaffoldContainer>
      ) : (
        <ScaffoldContainer bottomPadding>
          {state === 'loading' ? (
            <ScaffoldSection isFullWidth>
              <BucketHeader showActions={false} />
              <GenericTableLoader />
            </ScaffoldSection>
          ) : state === 'not-installed' ? (
            <ExtensionNotInstalled
              bucketName={bucket?.name}
              projectRef={project?.ref!}
              wrapperMeta={wrapperMeta}
              wrappersExtension={wrappersExtension!}
            />
          ) : state === 'needs-upgrade' ? (
            <ExtensionNeedsUpgrade
              bucketName={bucket?.name}
              projectRef={project?.ref!}
              wrapperMeta={wrapperMeta}
              wrappersExtension={wrappersExtension!}
            />
          ) : state === 'missing' ? (
            <WrapperMissing bucketName={bucket?.name} />
          ) : state === 'added' && wrapperInstance ? (
            <>
              <ScaffoldSection isFullWidth>
                <BucketHeader
                  namespaces={namespaces}
                  onSuccessConnectTables={() => {
                    setPollIntervalNamespaces(4000)
                    setPollIntervalNamespaceTables(4000)
                  }}
                />

                {isLoadingNamespaces || isLoadingWrapperInstance ? (
                  <GenericTableLoader headers={['Name']} />
                ) : namespaces.length === 0 ? (
                  <>
                    {HIDE_REPLICATION_USER_FLOW ? (
                      <CreateTableInstructions />
                    ) : isPollingForData ? (
                      <EmptyStatePresentational
                        icon={
                          <Loader2
                            size={24}
                            strokeWidth={1.5}
                            className="animate-spin text-foreground-muted"
                          />
                        }
                        title="Connecting table(s) to bucket"
                        description="Tables will be shown here once the connection is complete"
                      />
                    ) : (
                      <EmptyStatePresentational
                        icon={SquarePlus}
                        title="Connect database tables"
                        description="Stream table data for continuous backups and analysis"
                      >
                        <ConnectTablesDialog
                          onSuccessConnectTables={() => {
                            setPollIntervalNamespaces(4000)
                            setPollIntervalNamespaceTables(4000)
                          }}
                        />
                      </EmptyStatePresentational>
                    )}
                  </>
                ) : (
                  <>
                    {!!pipeline && !!isSuccessPipelineStatus && !isPipelineRunning && (
                      <Admonition
                        type="note"
                        layout="horizontal"
                        className="[&>div]:pl-[2.5rem] [&>div]:-translate-y-[3px]"
                        childProps={{ title: { className: 'block capitalize-sentence' } }}
                        showIcon={isPipelineStopped}
                        title={
                          isPipelineStopped
                            ? `Replication on the bucket has ${pipelineStatus}`
                            : `${pipelineStatus} replication on the bucket...`
                        }
                        description={
                          isPipelineStopped
                            ? 'Data changes from Postgres tables is currently not streaming to their corresponding analytics bucket table'
                            : 'Data changes from Postgres tables will resume streaming once pipeline has started'
                        }
                        actions={
                          <div className="flex items-center gap-x-2">
                            <Button asChild type="default">
                              <Link
                                href={`/project/${projectRef}/database/replication/${pipeline.replicator_id}`}
                              >
                                View replication
                              </Link>
                            </Button>
                            {isPipelineStopped && (
                              <Button
                                type="default"
                                loading={isStartingPipeline}
                                onClick={async () => {
                                  if (projectRef) {
                                    await startPipeline({ projectRef, pipelineId: pipeline.id })
                                  }
                                }}
                              >
                                Restart
                              </Button>
                            )}
                          </div>
                        }
                      >
                        {!isPipelineStopped && (
                          <Loader2 size={18} className="absolute top-1.5 left-[3px] animate-spin" />
                        )}
                      </Admonition>
                    )}
                    <div className="flex flex-col gap-y-10">
                      {namespaces.map(({ namespace, schema, tables }) => (
                        <NamespaceWithTables
                          key={namespace}
                          namespace={namespace}
                          sourceType="direct"
                          schema={schema}
                          tables={tables as any}
                          wrapperValues={wrapperValues}
                          pollIntervalNamespaceTables={pollIntervalNamespaceTables}
                          setPollIntervalNamespaceTables={setPollIntervalNamespaceTables}
                        />
                      ))}
                    </div>
                  </>
                )}
              </ScaffoldSection>

              <SimpleConfigurationDetails bucketName={bucket?.name} />
            </>
          ) : null}

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
                  disabled={!bucket?.name || !isSuccessBucket}
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete bucket
                </Button>
              </CardContent>
            </Card>
          </ScaffoldSection>
        </ScaffoldContainer>
      )}

      <DeleteAnalyticsBucketModal
        visible={showDeleteModal}
        bucketId={bucket?.name}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={() => router.push(`/project/${projectRef}/storage/analytics`)}
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
    (wrappersExtension?.default_version ?? '') < (wrapperMeta?.minimumExtensionVersion ?? '')

  return (
    <>
      <ScaffoldSection isFullWidth>
        <Admonition type="warning" title="Missing required extension" className="mb-0">
          <p>
            The Wrappers extension is required in order to query analytics tables.{' '}
            {databaseNeedsUpgrading &&
              'Please first upgrade your database and then install the extension.'}{' '}
            <InlineLink
              href={`${DOCS_URL}/guides/database/extensions/wrappers/iceberg`}
              target="_blank"
              rel="noreferrer"
              className="text-foreground-lighter hover:text-foreground transition-colors"
            >
              Learn more
            </InlineLink>
          </p>
          <Button type="default" asChild className="mt-2" onClick={() => {}}>
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
      <SimpleConfigurationDetails bucketName={bucketName} />
    </>
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
    <>
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
      <SimpleConfigurationDetails bucketName={bucketName} />
    </>
  )
}

const WrapperMissing = ({ bucketName }: { bucketName?: string }) => {
  const { mutateAsync: createIcebergWrapper, isPending: isCreatingIcebergWrapper } =
    useIcebergWrapperCreateMutation()

  const onSetupWrapper = async () => {
    if (!bucketName) return console.error('Bucket name is required')
    await createIcebergWrapper({ bucketName })
  }

  return (
    <>
      <ScaffoldSection isFullWidth>
        <Admonition type="warning" title="Missing integration" className="mb-0">
          <p>The Iceberg Wrapper integration is required in order to query analytics tables.</p>
          <Button type="default" loading={isCreatingIcebergWrapper} onClick={onSetupWrapper}>
            Install wrapper
          </Button>
        </Admonition>
      </ScaffoldSection>
      <SimpleConfigurationDetails bucketName={bucketName} />
    </>
  )
}
