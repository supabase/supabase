import { useIsNewStorageUIEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { WRAPPER_HANDLERS } from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import {
  convertKVStringArrayToJson,
  formatWrapperTables,
  wrapperMetaComparator,
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
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { Bucket } from 'data/storage/buckets-query'
import { useIcebergNamespacesQuery } from 'data/storage/iceberg-namespaces-query'
import { useIcebergWrapperCreateMutation } from 'data/storage/iceberg-wrapper-create-mutation'
import { useVaultSecretDecryptedValueQuery } from 'data/vault/vault-secret-decrypted-value-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { snakeCase, uniq } from 'lodash'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { DeleteBucketModal } from '../DeleteBucketModal'
import { DESCRIPTIONS, LABELS, OPTION_ORDER } from './constants'
import { CopyEnvButton } from './CopyEnvButton'
import { DecryptedReadOnlyInput } from './DecryptedReadOnlyInput'
import { NamespaceRow } from './NamespaceRow'
import { SimpleConfigurationDetails } from './SimpleConfigurationDetails'
import { useIcebergWrapperExtension } from './useIcebergWrapper'

export const AnalyticBucketDetails = ({ bucket }: { bucket: Bucket }) => {
  const [modal, setModal] = useState<'delete' | null>(null)
  const isStorageV2 = useIsNewStorageUIEnabled()
  const { data: project } = useSelectedProjectQuery()

  const { data: extensionsData } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data, isLoading: isFDWsLoading } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  /** The wrapper instance is the wrapper that is installed for this Analytics bucket. */
  const wrapperInstance = useMemo(() => {
    return data
      ?.filter((wrapper) =>
        wrapperMetaComparator(
          {
            handlerName: WRAPPER_HANDLERS.ICEBERG,
            server: {
              options: [],
            },
          },
          wrapper
        )
      )
      .find((w) => w.name === snakeCase(`${bucket.name}_fdw`))
  }, [data, bucket.name])

  const { state: extensionState } = useIcebergWrapperExtension()

  const integration = INTEGRATIONS.find((i) => i.id === 'iceberg_wrapper' && i.type === 'wrapper')

  const wrapperValues = convertKVStringArrayToJson(wrapperInstance?.server_options ?? [])
  const wrapperMeta = (integration?.type === 'wrapper' && integration.meta) as WrapperMeta

  const { data: token, isSuccess: isSuccessToken } = useVaultSecretDecryptedValueQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: wrapperValues.vault_token,
    },
    {
      enabled: wrapperValues.vault_token !== undefined,
    }
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

  const wrappersExtension = extensionsData?.find((ext) => ext.name === 'wrappers')

  const config = BUCKET_TYPES['analytics']

  const state = isFDWsLoading
    ? 'loading'
    : extensionState === 'installed'
      ? wrapperInstance
        ? 'added'
        : 'missing'
      : extensionState

  return (
    <>
      <PageLayout
        title={bucket.name}
        breadcrumbs={
          isStorageV2
            ? [
                {
                  label: 'Analytics',
                  href: `/project/${project?.ref}/storage/analytics`,
                },
              ]
            : []
        }
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
              bucketName={bucket.name}
              projectRef={project?.ref!}
              wrapperMeta={wrapperMeta}
              wrappersExtension={wrappersExtension!}
            />
          )}
          {state === 'needs-upgrade' && (
            <ExtensionNeedsUpgrade
              bucketName={bucket.name}
              projectRef={project?.ref!}
              wrapperMeta={wrapperMeta}
              wrappersExtension={wrappersExtension!}
            />
          )}

          {state === 'added' && wrapperInstance && (
            <>
              {isStorageV2 ? (
                <ScaffoldSection isFullWidth>
                  <ScaffoldHeader className="flex flex-row justify-between items-end gap-x-8">
                    <div>
                      <ScaffoldSectionTitle>Tables</ScaffoldSectionTitle>
                      <ScaffoldSectionDescription>
                        Analytics tables connected to this bucket.
                      </ScaffoldSectionDescription>
                    </div>
                    <Button type="primary" size="tiny" icon={<Plus size={14} />} onClick={() => {}}>
                      New table
                    </Button>
                  </ScaffoldHeader>

                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-foreground-muted">Name</TableHead>
                          <TableHead className="text-foreground-muted">Schema</TableHead>
                          <TableHead className="text-foreground-muted">Created at</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={4}>
                            <p className="text-sm text-foreground">No tables yet</p>
                            <p className="text-sm text-foreground-lighter">
                              Create an analytics table to get started
                            </p>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Card>
                </ScaffoldSection>
              ) : (
                <ScaffoldSection isFullWidth>
                  <ScaffoldHeader>
                    <ScaffoldSectionTitle>Namespaces</ScaffoldSectionTitle>
                    <ScaffoldSectionDescription>
                      Connected namespaces and tables.
                    </ScaffoldSectionDescription>
                  </ScaffoldHeader>

                  {isLoadingNamespaces || isFDWsLoading ? (
                    <GenericSkeletonLoader />
                  ) : namespaces.length === 0 ? (
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-foreground-muted">Namespace</TableHead>
                            <TableHead className="text-foreground-muted">Schema</TableHead>
                            <TableHead className="text-foreground-muted">Tables</TableHead>
                            <TableHead />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell colSpan={4}>
                              <p className="text-sm text-foreground">
                                No namespaces in this bucket
                              </p>
                              <p className="text-sm text-foreground-lighter">
                                Create a namespace and add some data
                              </p>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Card>
                  ) : (
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Namespace</TableHead>
                            <TableHead>Schema</TableHead>
                            <TableHead>Tables</TableHead>
                            <TableHead />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {namespaces.map(({ namespace, schema, tables }) => (
                            <NamespaceRow
                              key={namespace}
                              bucketName={bucket.name}
                              namespace={namespace}
                              schema={schema}
                              tables={tables as any}
                              token={token!}
                              wrapperInstance={wrapperInstance}
                              wrapperValues={wrapperValues}
                              wrapperMeta={wrapperMeta}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  )}
                </ScaffoldSection>
              )}

              <ScaffoldSection isFullWidth>
                <ScaffoldHeader className="flex flex-row justify-between items-end gap-x-8">
                  <div>
                    <ScaffoldSectionTitle>Configuration</ScaffoldSectionTitle>
                    <ScaffoldSectionDescription>
                      Connect to this bucket from an Iceberg client.{' '}
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
          {state === 'missing' && <WrapperMissing bucketName={bucket.name} />}

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
