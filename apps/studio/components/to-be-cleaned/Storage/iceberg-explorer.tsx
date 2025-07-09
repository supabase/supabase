import { SquareArrowOutUpRight } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { WRAPPER_HANDLERS } from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import {
  convertKVStringArrayToJson,
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
import { DecryptedReadOnlyInput } from './decrypted-read-only-input'

export const IcebergExplorer = ({ bucket }: { bucket: Bucket }) => {
  const { project } = useProjectContext()

  const { data: extensionsData, isLoading: isExtensionsLoading } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data, isLoading: isFDWsLoading } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const wrapper = useMemo(() => {
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
      .find((w) => w.name === 'iceberg_wrapper')
  }, [data])

  const integration = INTEGRATIONS.find((i) => i.id === 'iceberg_wrapper')!

  if (integration.type !== 'wrapper') {
    // This should never happen
    return <p className="text-sm text-foreground-light">Unsupported integration type</p>
  }

  const values = convertKVStringArrayToJson(wrapper?.server_options ?? [])
  const wrapperMeta = integration.meta

  const wrappersExtension = extensionsData?.find((ext) => ext.name === 'wrappers')
  const isWrappersExtensionInstalled = !!wrappersExtension?.installed_version
  const hasRequiredVersion =
    (wrappersExtension?.installed_version ?? '') >= (wrapperMeta?.minimumExtensionVersion ?? '')

  const state =
    isExtensionsLoading || isFDWsLoading
      ? 'loading'
      : isWrappersExtensionInstalled
        ? hasRequiredVersion
          ? wrapper
            ? 'installed'
            : 'missing'
          : 'needs-upgrade'
        : ('not-installed' as const)

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
            projectRef={project?.ref!}
            wrapperMeta={wrapperMeta}
            wrappersExtension={wrappersExtension!}
          />
        )}
        {state === 'needs-upgrade' && (
          <ExtensionNeedsUpgrade
            projectRef={project?.ref!}
            wrapperMeta={wrapperMeta}
            wrappersExtension={wrappersExtension!}
          />
        )}
        {state === 'installed' && wrapper && (
          <>
            <Alert_Shadcn_ className="p-10">
              <AlertTitle_Shadcn_ className="flex flex-col">
                <div className="flex flex-row justify-between items-center">
                  <div className="col-span-2 space-y-1">
                    <p className="block">You're all set!</p>
                    <p className="text-sm opacity-50">
                      A wrapper has been setup for this bucket. You can use the Table Editor or SQL
                      Editor to view the tables.
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
            </Alert_Shadcn_>

            <div>
              <ScaffoldSectionTitle>Connection Details for 3rd Party Clients</ScaffoldSectionTitle>
              <ScaffoldSectionDescription className="mb-4">
                Authenticate your users through a suite of providers and login methods
              </ScaffoldSectionDescription>
              <Card className="flex flex-col gap-6 p-6">
                {wrapperMeta.server.options
                  .filter((option) => !option.hidden && values[option.name])
                  .map((option) => {
                    return (
                      <DecryptedReadOnlyInput
                        key={option.name}
                        label={option.label}
                        secretName={`${wrapper.name}_${option.name}`}
                        value={values[option.name]}
                        secureEntry={option.secureEntry}
                        descriptionText="Used to decode your JWTs. You can also use this to mint your own JWTs."
                      />
                    )
                  })}
              </Card>
            </div>
          </>
        )}
        {state === 'missing' && <WrapperMissing projectRef={project?.ref!} />}
      </ScaffoldContainer>
    </div>
  )
}

const ExtensionNotInstalled = ({
  projectRef,
  wrapperMeta,
  wrappersExtension,
}: {
  projectRef: string
  wrapperMeta: WrapperMeta
  wrappersExtension: DatabaseExtension
}) => {
  const databaseNeedsUpgrading =
    (wrappersExtension?.default_version ?? '') < (wrapperMeta?.minimumExtensionVersion ?? '')

  return (
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
  )
}

const ExtensionNeedsUpgrade = ({
  projectRef,
  wrapperMeta,
  wrappersExtension,
}: {
  projectRef: string
  wrapperMeta: WrapperMeta
  wrappersExtension: DatabaseExtension
}) => {
  // [Joshen] Default version is what's on the DB, so if the installed version is already the default version
  // but still doesnt meet the minimum extension version, then DB upgrade is required
  const databaseNeedsUpgrading =
    wrappersExtension?.installed_version === wrappersExtension?.default_version

  return (
    <Alert_Shadcn_ variant="warning">
      <WarningIcon />
      <AlertTitle_Shadcn_>Your extension version is outdated for this wrapper.</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_ className="flex flex-col gap-y-2">
        <p>
          The {wrapperMeta.label} wrapper requires a minimum extension version of{' '}
          {wrapperMeta.minimumExtensionVersion}. You have version{' '}
          {wrappersExtension?.installed_version} installed. Please{' '}
          {databaseNeedsUpgrading && 'upgrade your database then '}update the extension by disabling
          and enabling the <code className="text-xs">wrappers</code> extension to create this
          wrapper.
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
  )
}

const WrapperMissing = ({ projectRef }: { projectRef: string }) => {
  return (
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
          <Link href={`/project/${projectRef}/integrations/iceberg_wrapper/overview`}>
            Setup a wrapper
          </Link>
        </Button>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
