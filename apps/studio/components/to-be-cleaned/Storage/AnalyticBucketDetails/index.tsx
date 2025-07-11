import { snakeCase } from 'lodash'
import { SquareArrowOutUpRight } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { WRAPPER_HANDLERS } from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import {
  convertKVStringArrayToJson,
  wrapperMetaComparator,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { ImportForeignSchemaDialog } from 'components/interfaces/Storage/ImportForeignSchemaDialog'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import {
  DatabaseExtension,
  useDatabaseExtensionsQuery,
} from 'data/database-extensions/database-extensions-query'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { Bucket } from 'data/storage/buckets-query'
import { useIcebergWrapperCreateMutation } from 'data/storage/iceberg-wrapper-create-mutation'
import { BASE_PATH } from 'lib/constants'
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
import { SimpleConfigurationDetails } from './SimpleConfigurationDetails'
import { useIcebergWrapperExtension } from './useIcebergWrapper'

export const AnalyticBucketDetails = ({ bucket }: { bucket: Bucket }) => {
  const { project } = useProjectContext()
  const [importForeignSchemaShown, setImportForeignSchemaShown] = useState(false)

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

  const integration = INTEGRATIONS.find((i) => i.id === 'iceberg_wrapper')!

  if (integration.type !== 'wrapper') {
    // This should never happen
    return <p className="text-sm text-foreground-light">Unsupported integration type</p>
  }

  const values = convertKVStringArrayToJson(wrapperInstance?.server_options ?? [])
  const wrapperMeta = integration.meta

  const wrappersExtension = extensionsData?.find((ext) => ext.name === 'wrappers')

  const state = isFDWsLoading
    ? 'loading'
    : extensionState === 'installed'
      ? wrapperInstance
        ? 'added'
        : 'missing'
      : extensionState

  const isWrapperSchemaInstalled = (wrapperInstance?.tables || []).length > 0

  return (
    <div className="flex flex-col w-full">
      <ScaffoldContainer className="flex flex-row justify-between items-center gap-10">
        <ScaffoldHeader>
          <ScaffoldTitle>
            Iceberg Bucket <span className="text-brand">{bucket.name}</span>
          </ScaffoldTitle>
        </ScaffoldHeader>
        {wrapperInstance && wrapperInstance?.tables?.length > 0 && (
          <div className="flex items-end justify-end gap-2">
            <a
              href={`${BASE_PATH}/project/${project?.ref}/editor?schema=${wrapperInstance?.tables[0]?.schema}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button type="default" icon={<SquareArrowOutUpRight />}>
                Table Editor
              </Button>
            </a>
            <a
              href={`${BASE_PATH}/project/${project?.ref}/sql/new?${encodeURIComponent(`select * from ${wrapperInstance?.tables[0]?.schema}.${wrapperInstance?.tables[0]?.name}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button type="default" icon={<SquareArrowOutUpRight />}>
                SQL Editor
              </Button>
            </a>
          </div>
        )}
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
            <Alert_Shadcn_ className="px-6 py-4">
              <AlertTitle_Shadcn_ className="flex flex-col">
                <div className="flex flex-row justify-between items-center gap-10">
                  <div className="col-span-2 space-y-1">
                    <p className="block">Connect a namespace</p>
                    <p className="text-sm text-foreground-light">
                      When you connect a namespace, you can view its tables in the Table Editor or
                      SQL Editor. If you add new tables to the namespace, you need to reconnect it
                      to get the new tables. You can multiple namespaces.
                    </p>
                  </div>
                  <Button type="primary" onClick={() => setImportForeignSchemaShown(true)}>
                    Connect namespace
                  </Button>
                </div>
              </AlertTitle_Shadcn_>
            </Alert_Shadcn_>

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
                    (option) => !option.hidden && values[option.name]
                  )}
                  values={values}
                />
              </div>
              <Card className="flex flex-col gap-6 p-6 pb-0">
                {wrapperMeta.server.options
                  .filter((option) => !option.hidden && values[option.name])
                  .map((option) => {
                    return (
                      <DecryptedReadOnlyInput
                        key={option.name}
                        label={option.label}
                        value={values[option.name]}
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
      <ImportForeignSchemaDialog
        bucketName={bucket.name}
        wrapperValues={values}
        visible={importForeignSchemaShown}
        onClose={() => setImportForeignSchemaShown(false)}
      />
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
