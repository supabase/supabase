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
import { ImportForeignSchemaDialog } from 'components/interfaces/Storage/import-foreign-schema-dialog'
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
import { DecryptedReadOnlyInput } from './decrypted-read-only-input'
import { DownloadEnvButton } from './download-env-button'
import { SimpleConfigurationDetails } from './simple-configuration-details'
import { useIcebergWrapperExtension } from './use-iceberg-wrapper'

export const IcebergBucketDetails = ({ bucket }: { bucket: Bucket }) => {
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
  }, [data])

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
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>
            Iceberg Bucket <span className="text-brand">{bucket.name}</span>
          </ScaffoldTitle>
        </ScaffoldHeader>
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
            <Alert_Shadcn_ className="p-10">
              {isWrapperSchemaInstalled ? (
                <AlertTitle_Shadcn_ className="flex flex-col">
                  <div className="flex flex-row justify-between items-center">
                    <div className="col-span-2 space-y-1">
                      <p className="block">You're all set!</p>
                      <p className="text-sm opacity-50">
                        A wrapper has been setup for this bucket. You can use the Table Editor or
                        SQL Editor to view the tables.
                      </p>
                    </div>
                    <div className="flex items-end justify-end gap-2">
                      <Button type="default" icon={<SquareArrowOutUpRight />}>
                        Table Editor
                      </Button>
                      <Button type="default" icon={<SquareArrowOutUpRight />}>
                        SQL Editor
                      </Button>
                    </div>
                  </div>
                </AlertTitle_Shadcn_>
              ) : (
                <AlertTitle_Shadcn_ className="flex flex-col">
                  <div className="flex flex-row justify-between items-center space-x-10">
                    <div className="col-span-2 space-y-1">
                      <p className="block">You need to set the namespace</p>
                      <p className="text-sm opacity-50">
                        The foreign data wrapper which connects the Iceberg data to the database is
                        not fully setup. Once you've created the namespace in the Iceberg catalog,
                        you'll need to set the namespace in the wrapper.
                      </p>
                    </div>
                    <div className="flex items-end justify-end gap-2">
                      <Button type="default" onClick={() => setImportForeignSchemaShown(true)}>
                        Set namespace
                      </Button>
                    </div>
                  </div>
                </AlertTitle_Shadcn_>
              )}
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
                <DownloadEnvButton
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
  const { project } = useProjectContext()

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
          <Button asChild type="default">
            <Link href={`/project/${project?.ref}/integrations/iceberg_wrapper/overview`}>
              Setup a wrapper
            </Link>
          </Button>
        </AlertDescription_Shadcn_>
      </Alert_Shadcn_>
      <SimpleConfigurationDetails bucketName={bucketName} />
    </>
  )
}
