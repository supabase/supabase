import { snakeCase, uniq } from 'lodash'
import Link from 'next/link'
import { useMemo } from 'react'

import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { WRAPPER_HANDLERS } from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import {
  convertKVStringArrayToJson,
  formatWrapperTables,
  wrapperMetaComparator,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import {
  DatabaseExtension,
  useDatabaseExtensionsQuery,
} from 'data/database-extensions/database-extensions-query'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { Bucket } from 'data/storage/buckets-query'
import { useIcebergNamespacesQuery } from 'data/storage/iceberg-namespaces-query'
import { useIcebergWrapperCreateMutation } from 'data/storage/iceberg-wrapper-create-mutation'
import { useVaultSecretDecryptedValueQuery } from 'data/vault/vault-secret-decrypted-value-query'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Card,
  WarningIcon,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { DESCRIPTIONS } from './constants'
import { CopyEnvButton } from './CopyEnvButton'
import { DecryptedReadOnlyInput } from './DecryptedReadOnlyInput'
import { NamespaceCard } from './NamespaceCard'
import { SimpleConfigurationDetails } from './SimpleConfigurationDetails'
import { useIcebergWrapperExtension } from './useIcebergWrapper'

export const AnalyticBucketDetails = ({ bucket }: { bucket: Bucket }) => {
  const { project } = useProjectContext()

  const { data: extensionsData } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data, isLoading: isFDWsLoading } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  /** The wrapper instance is the wrapper that is installed for this iceberg bucket. */
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

  const extensionState = useIcebergWrapperExtension()

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
      return {
        namespace,
        tables: wrapperTables.filter((t) => t.table.split('.')[0] === namespace),
      }
    })
  }, [wrapperTables, namespacesData])

  const wrappersExtension = extensionsData?.find((ext) => ext.name === 'wrappers')

  const state = isFDWsLoading
    ? 'loading'
    : extensionState === 'installed'
      ? wrapperInstance
        ? 'added'
        : 'missing'
      : extensionState

  return (
    <div className="flex flex-col w-full">
      <ScaffoldContainer className="flex flex-row justify-between items-center gap-10">
        <ScaffoldHeader>
          <ScaffoldTitle>
            Iceberg Bucket <span className="text-brand">{bucket.name}</span>
          </ScaffoldTitle>
          <ScaffoldSectionDescription>
            Tables and objects connected to this Iceberg bucket
          </ScaffoldSectionDescription>
        </ScaffoldHeader>
        <DocsButton href="https://supabase.com/docs/guides/storage/analytics/connecting-to-analytics-bucket" />
        {/* <Button type="primary" onClick={() => setImportForeignSchemaShown(true)}>
          {wrapperTables.length === 0 ? 'Connect a namespace' : 'Connect another namespace'}
        </Button> */}
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-4" bottomPadding>
        {state === 'loading' && <GenericSkeletonLoader />}
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
            <div className="flex flex-col gap-4">
              {isLoadingNamespaces || isFDWsLoading ? (
                <GenericSkeletonLoader />
              ) : namespaces.length === 0 ? (
                <Card className="flex flex-col px-20 py-16 items-center justify-center space-y-3">
                  <p className="text-sm text-foreground-light">No namespaces on the bucket yet</p>
                </Card>
              ) : (
                namespaces.map(({ namespace, tables }) => (
                  <NamespaceCard
                    key={namespace}
                    bucketName={bucket.name}
                    namespace={namespace}
                    token={token!}
                    wrapperInstance={wrapperInstance}
                    wrapperValues={wrapperValues}
                    tables={tables as any}
                    integration={integration!}
                  />
                ))
              )}
            </div>

            <div>
              <div className="flex flex-row justify-between items-center">
                <div>
                  <ScaffoldSectionTitle>Configuration Details</ScaffoldSectionTitle>
                  <ScaffoldSectionDescription className="mb-4">
                    You can use the following configuration details to connect to the bucket from
                    your code.
                  </ScaffoldSectionDescription>
                </div>
                <CopyEnvButton
                  serverOptions={wrapperMeta.server.options.filter(
                    (option) => !option.hidden && wrapperValues[option.name]
                  )}
                  values={wrapperValues}
                />
              </div>
              <Card className="flex flex-col gap-6 p-6 pb-0">
                {wrapperMeta.server.options
                  .filter((option) => !option.hidden && wrapperValues[option.name])
                  .map((option) => {
                    return (
                      <DecryptedReadOnlyInput
                        key={option.name}
                        label={option.label}
                        value={wrapperValues[option.name]}
                        secureEntry={option.secureEntry}
                        descriptionText={DESCRIPTIONS[option.name]}
                      />
                    )
                  })}
              </Card>
            </div>
          </>
        )}
        {state === 'missing' && <WrapperMissing bucketName={bucket.name} />}
      </ScaffoldContainer>
    </div>
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
      <Alert_Shadcn_ variant="warning">
        <WarningIcon />
        <AlertTitle_Shadcn_>
          You need to install the wrappers extension to connect this Iceberg bucket to the database.
        </AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_ className="flex flex-col gap-y-2">
          <p>
            The {wrapperMeta.label} wrapper requires the Wrappers extension to be installed. You can
            install version {wrappersExtension?.installed_version}
            {databaseNeedsUpgrading &&
              ' which is below the minimum version that supports Iceberg wrapper'}
            . Please {databaseNeedsUpgrading && 'upgrade your database then '}install the{' '}
            <code className="text-xs">wrappers</code> extension to create this wrapper.
          </p>
        </AlertDescription_Shadcn_>
        <AlertDescription_Shadcn_ className="mt-3">
          <Button asChild type="default">
            <Link
              href={
                databaseNeedsUpgrading
                  ? `/project/${projectRef}/settings/infrastructure`
                  : `/project/${projectRef}/database/extensions?filter=wrappers`
              }
            >
              {databaseNeedsUpgrading ? 'Upgrade database' : 'Install wrappers extension'}
            </Link>
          </Button>
        </AlertDescription_Shadcn_>
      </Alert_Shadcn_>
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
      <Alert_Shadcn_ variant="warning">
        <WarningIcon />
        <AlertTitle_Shadcn_>
          Your extension version is outdated for this wrapper.
        </AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_ className="flex flex-col gap-y-2">
          <p>
            The {wrapperMeta.label} wrapper requires a minimum extension version of{' '}
            {wrapperMeta.minimumExtensionVersion}. You have version{' '}
            {wrappersExtension?.installed_version} installed. Please{' '}
            {databaseNeedsUpgrading && 'upgrade your database then '}update the extension by
            disabling and enabling the <code className="text-xs">wrappers</code> extension to create
            this wrapper.
          </p>
          <p className="text-warning">
            Warning: Before reinstalling the wrapper extension, you must first remove all existing
            wrappers. Afterward, you can recreate the wrappers.
          </p>
        </AlertDescription_Shadcn_>
        <AlertDescription_Shadcn_ className="mt-3">
          <Button asChild type="default">
            <Link
              href={
                databaseNeedsUpgrading
                  ? `/project/${projectRef}/settings/infrastructure`
                  : `/project/${projectRef}/database/extensions?filter=wrappers`
              }
            >
              {databaseNeedsUpgrading ? 'Upgrade database' : 'View wrappers extension'}
            </Link>
          </Button>
        </AlertDescription_Shadcn_>
      </Alert_Shadcn_>
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
      <Alert_Shadcn_ variant="warning">
        <WarningIcon />
        <AlertTitle_Shadcn_>
          This Iceberg bucket does not have a foreign data wrapper setup.
        </AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_ className="flex flex-col gap-y-2">
          <p>You need to setup a wrapper to connect this Iceberg bucket to the database.</p>
        </AlertDescription_Shadcn_>
        <AlertDescription_Shadcn_ className="mt-3">
          <Button type="default" loading={isCreatingIcebergWrapper} onClick={onSetupWrapper}>
            Setup a wrapper
          </Button>
        </AlertDescription_Shadcn_>
      </Alert_Shadcn_>
      <SimpleConfigurationDetails bucketName={bucketName} />
    </>
  )
}
