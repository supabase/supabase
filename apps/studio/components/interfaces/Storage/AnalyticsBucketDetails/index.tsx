import { uniq } from 'lodash'
import { SquarePlus } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import {
  convertKVStringArrayToJson,
  formatWrapperTables,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { BUCKET_TYPES } from 'components/interfaces/Storage/Storage.constants'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { InlineLink } from 'components/ui/InlineLink'
import {
  DatabaseExtension,
  useDatabaseExtensionsQuery,
} from 'data/database-extensions/database-extensions-query'
import { AnalyticsBucket } from 'data/storage/analytics-buckets-query'
import { useIcebergNamespacesQuery } from 'data/storage/iceberg-namespaces-query'
import { useIcebergWrapperCreateMutation } from 'data/storage/iceberg-wrapper-create-mutation'
import { useVaultSecretDecryptedValueQuery } from 'data/vault/vault-secret-decrypted-value-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { Button, Card, CardContent } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { DeleteBucketModal } from '../DeleteBucketModal'
import { ConnectTablesDialog } from './ConnectTablesDialog'
import { DESCRIPTIONS, LABELS, OPTION_ORDER } from './constants'
import { CopyEnvButton } from './CopyEnvButton'
import { DecryptedReadOnlyInput } from './DecryptedReadOnlyInput'
import { NamespaceWithTables } from './NamespaceWithTables'
import { SimpleConfigurationDetails } from './SimpleConfigurationDetails'
import { useAnalyticsBucketWrapperInstance } from './useAnalyticsBucketWrapperInstance'
import { useIcebergWrapperExtension } from './useIcebergWrapper'

export const AnalyticBucketDetails = ({ bucket }: { bucket: AnalyticsBucket }) => {
  const config = BUCKET_TYPES.analytics
  const [modal, setModal] = useState<'delete' | null>(null)
  const { data: project } = useSelectedProjectQuery()
  const { state: extensionState } = useIcebergWrapperExtension()

  /** The wrapper instance is the wrapper that is installed for this Analytics bucket. */
  const { data: wrapperInstance, isLoading } = useAnalyticsBucketWrapperInstance({
    bucketId: bucket.id,
  })
  const wrapperValues = convertKVStringArrayToJson(wrapperInstance?.server_options ?? [])
  const integration = INTEGRATIONS.find((i) => i.id === 'iceberg_wrapper' && i.type === 'wrapper')
  const wrapperMeta = (integration?.type === 'wrapper' && integration.meta) as WrapperMeta

  const { data: extensionsData } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const wrappersExtension = extensionsData?.find((ext) => ext.name === 'wrappers')

  const { data: token, isSuccess: isSuccessToken } = useVaultSecretDecryptedValueQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: wrapperValues.vault_token,
    },
    { enabled: wrapperValues.vault_token !== undefined }
  )

  const { data: namespacesData, isLoading: isLoadingNamespaces } = useIcebergNamespacesQuery(
    {
      catalogUri: wrapperValues.catalog_uri,
      warehouse: wrapperValues.warehouse,
      token: token!,
    },
    { enabled: isSuccessToken }
  )

  const wrapperTables = useMemo(() => {
    if (!wrapperInstance) return []

    return formatWrapperTables(wrapperInstance, wrapperMeta!)
  }, [wrapperInstance, wrapperMeta])

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

  const state = isLoading
    ? 'loading'
    : extensionState === 'installed'
      ? wrapperInstance
        ? 'added'
        : 'missing'
      : extensionState

  return (
    <>
      <PageLayout
        title={bucket.id}
        breadcrumbs={[
          {
            label: 'Analytics',
            href: `/project/${project?.ref}/storage/analytics`,
          },
        ]}
        secondaryActions={config?.docsUrl ? [<DocsButton key="docs" href={config.docsUrl} />] : []}
      >
        <ScaffoldContainer bottomPadding>
          {state === 'loading' && (
            <ScaffoldSection isFullWidth>
              <GenericSkeletonLoader />
            </ScaffoldSection>
          )}
          {state === 'not-installed' && (
            <ExtensionNotInstalled
              bucketName={bucket.id}
              projectRef={project?.ref!}
              wrapperMeta={wrapperMeta}
              wrappersExtension={wrappersExtension!}
            />
          )}
          {state === 'needs-upgrade' && (
            <ExtensionNeedsUpgrade
              bucketName={bucket.id}
              projectRef={project?.ref!}
              wrapperMeta={wrapperMeta}
              wrappersExtension={wrappersExtension!}
            />
          )}

          {state === 'added' && wrapperInstance && (
            <>
              <ScaffoldSection isFullWidth>
                <ScaffoldHeader className="pt-0 flex flex-row justify-between items-end gap-x-8">
                  <div>
                    <ScaffoldSectionTitle>Tables</ScaffoldSectionTitle>
                    <ScaffoldSectionDescription>
                      Analytics tables stored in this bucket
                    </ScaffoldSectionDescription>
                  </div>
                  {namespaces.length > 0 && <ConnectTablesDialog bucket={bucket} />}
                </ScaffoldHeader>

                {isLoadingNamespaces || isLoading ? (
                  <GenericSkeletonLoader />
                ) : namespaces.length === 0 ? (
                  <aside className="border border-dashed w-full bg-surface-100 rounded-lg px-4 py-10 flex flex-col gap-y-3 items-center text-center gap-1 text-balance">
                    <SquarePlus size={24} strokeWidth={1.5} className="text-foreground-muted" />
                    <div className="flex flex-col items-center text-center">
                      <h3>Connect database tables</h3>
                      <p className="text-foreground-light text-sm">
                        Stream data from tables for archival, backups, or analytical queries.
                      </p>
                    </div>
                    <ConnectTablesDialog bucket={bucket} />
                  </aside>
                ) : (
                  <div className="flex flex-col gap-y-10">
                    {namespaces.map(({ namespace, schema, tables }) => (
                      <NamespaceWithTables
                        key={namespace}
                        bucketName={bucket.id}
                        namespace={namespace}
                        sourceType="direct"
                        schema={schema}
                        tables={tables as any}
                        token={token!}
                        wrapperInstance={wrapperInstance}
                        wrapperValues={wrapperValues}
                        wrapperMeta={wrapperMeta}
                      />
                    ))}
                  </div>
                )}
              </ScaffoldSection>

              <ScaffoldSection isFullWidth>
                <ScaffoldHeader className="flex flex-row justify-between items-end gap-x-8">
                  <div>
                    <ScaffoldSectionTitle>Connection details</ScaffoldSectionTitle>
                    <ScaffoldSectionDescription>
                      Connect an Iceberg client to this bucket.{' '}
                      <InlineLink
                        href={`${DOCS_URL}/guides/storage/analytics/connecting-to-analytics-bucket`}
                      >
                        Learn more
                      </InlineLink>
                    </ScaffoldSectionDescription>
                  </div>
                  <CopyEnvButton
                    serverOptions={wrapperMeta.server.options.filter(
                      (option) => !option.hidden && wrapperValues[option.name]
                    )}
                    values={wrapperValues}
                  />
                </ScaffoldHeader>

                <Card>
                  {wrapperMeta.server.options
                    .filter((option) => !option.hidden && wrapperValues[option.name])
                    .sort((a, b) => OPTION_ORDER.indexOf(a.name) - OPTION_ORDER.indexOf(b.name))
                    .map((option) => {
                      return (
                        <DecryptedReadOnlyInput
                          key={option.name}
                          label={LABELS[option.name]}
                          value={wrapperValues[option.name]}
                          secureEntry={option.secureEntry}
                          descriptionText={DESCRIPTIONS[option.name]}
                        />
                      )
                    })}
                </Card>
              </ScaffoldSection>
            </>
          )}
          {state === 'missing' && <WrapperMissing bucketName={bucket.id} />}

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
                    setModal('delete')
                  }}
                >
                  Delete bucket
                </Button>
              </CardContent>
            </Card>
          </ScaffoldSection>
        </ScaffoldContainer>
      </PageLayout>

      <DeleteBucketModal
        visible={modal === `delete`}
        bucket={bucket}
        onClose={() => setModal(null)}
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
  bucketName: string
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
  bucketName: string
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

const WrapperMissing = ({ bucketName }: { bucketName: string }) => {
  const { mutateAsync: createIcebergWrapper, isLoading: isCreatingIcebergWrapper } =
    useIcebergWrapperCreateMutation()

  const onSetupWrapper = async () => {
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
