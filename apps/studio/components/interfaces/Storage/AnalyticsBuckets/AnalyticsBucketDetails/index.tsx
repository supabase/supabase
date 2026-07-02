import { useParams } from 'common'
import { uniq } from 'lodash'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import { Button, Card, CardContent } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { GenericTableLoader } from 'ui-patterns/ShimmeringLoader'

import { DeleteAnalyticsBucketModal } from '../DeleteAnalyticsBucketModal'
import { useSelectedAnalyticsBucket } from '../useSelectedAnalyticsBucket'
import { HIDE_REPLICATION_USER_FLOW } from './AnalyticsBucketDetails.constants'
import { ExtensionNeedsUpgrade, ExtensionNotInstalled, WrapperMissing } from './BucketCallouts'
import { BucketHeader } from './BucketHeader'
import { CreateTableInstructions } from './CreateTable/CreateTableInstructions'
import { NamespaceWithTables } from './NamespaceWithTables'
import { SimpleConfigurationDetails } from './SimpleConfigurationDetails'
import { useAnalyticsBucketAssociatedEntities } from './useAnalyticsBucketAssociatedEntities'
import { useIcebergWrapperExtension } from './useIcebergWrapper'
import { INTEGRATIONS } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { WrapperMeta } from '@/components/interfaces/Integrations/Wrappers/Wrappers.types'
import {
  convertKVStringArrayToJson,
  formatWrapperTables,
} from '@/components/interfaces/Integrations/Wrappers/Wrappers.utils'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionTitle,
} from '@/components/layouts/Scaffold'
import { AlertError } from '@/components/ui/AlertError'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useIcebergNamespacesQuery } from '@/data/storage/iceberg-namespaces-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

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

  const {
    publication,
    icebergWrapper: wrapperInstance,
    isLoadingWrapperInstance,
  } = useAnalyticsBucketAssociatedEntities({
    projectRef,
    bucketId: bucket?.name,
  })

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
    isPending: isLoadingNamespaces,
    isSuccess: isSuccessNamespaces,
  } = useIcebergNamespacesQuery(
    {
      projectRef,
      warehouse: wrapperValues.warehouse,
    },
    {
      refetchInterval: (query) => {
        const data = query.state.data
        if (pollIntervalNamespaces === 0) return false

        const publicationTableSchemas = publication?.tables.map((x) => x.schema) ?? []
        const isSynced = !publicationTableSchemas.some((x) => !data?.includes(x))
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
                <BucketHeader />

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
                    ) : null}
                  </>
                ) : (
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
                  variant="danger"
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
