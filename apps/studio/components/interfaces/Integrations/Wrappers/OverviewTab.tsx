import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import { RequiredExtensionsSection } from '../Integration/RequiredExtensionsSection'
import { useAvailableIntegrations } from '../Landing/useAvailableIntegrations'
import { AddWrapperButton } from './AddWrapperButton'
import { WRAPPERS } from './Wrappers.constants'
import { WrapperTable } from './WrapperTable'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { getServiceVersionsPath } from '@/components/interfaces/Settings/General/ServiceVersions/ServiceVersions.utils'
import { ScaffoldContainer, ScaffoldSection } from '@/components/layouts/Scaffold'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const WrapperOverviewContent = () => {
  return (
    <div className="flex flex-col gap-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <p>Recent wrappers</p>
        <AddWrapperButton variant="primary" />
      </div>
      <WrapperTable />
    </div>
  )
}

const AddNewWrapperCTA = () => {
  const { id } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const wrapperMeta = WRAPPERS.find((w) => w.name === id)
  const wrappersExtension = data?.find((ext) => ext.name === 'wrappers')
  const isWrappersExtensionInstalled = !!wrappersExtension?.installed_version
  const hasRequiredVersion =
    (wrappersExtension?.installed_version ?? '') >= (wrapperMeta?.minimumExtensionVersion ?? '')
  // [Joshen] Default version is what's on the DB, so if the installed version is already the default version
  // but still doesnt meet the minimum extension version, then DB upgrade is required
  const databaseNeedsUpgrading =
    wrappersExtension?.installed_version === wrappersExtension?.default_version

  if (!!wrapperMeta && isWrappersExtensionInstalled && !hasRequiredVersion) {
    return (
      <Admonition type="warning" title="Your extension version is outdated for this wrapper">
        <div className="flex flex-col gap-y-2 [&>p]:mb-0!">
          <p>
            The {wrapperMeta.label} wrapper requires a minimum extension version of{' '}
            {wrapperMeta.minimumExtensionVersion}. You have version{' '}
            {wrappersExtension?.installed_version} installed. Please{' '}
            {databaseNeedsUpgrading && 'upgrade your database then '}update the extension by
            disabling and enabling the <code className="text-code-inline">wrappers</code> extension
            to create this wrapper.
          </p>
          <p className="text-warning">
            Warning: Before reinstalling the wrapper extension, you must first remove all existing
            wrappers. Afterward, you can recreate the wrappers.
          </p>
        </div>
        <Button asChild className="w-min mt-3">
          <Link
            href={
              databaseNeedsUpgrading
                ? getServiceVersionsPath(project?.ref)
                : `/project/${project?.ref}/database/extensions?filter=wrappers`
            }
          >
            {databaseNeedsUpgrading ? 'Upgrade database' : 'View wrappers extension'}
          </Link>
        </Button>
      </Admonition>
    )
  }

  return null
}

export const WrapperContent = () => {
  const { id } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { data: integrations = [] } = useAvailableIntegrations()
  const integration = integrations.find((i) => i.id === id)
  const wrapperMeta = WRAPPERS.find((w) => w.name === id)

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const installableExtensions = (extensions ?? []).filter((ext) =>
    (integration?.requiredExtensions ?? []).includes(ext.name)
  )
  const isInstalled = installableExtensions.every((x) => x.installed_version)

  if (!wrapperMeta) {
    return (
      <ScaffoldContainer>
        <ScaffoldSection isFullWidth>
          <p className="text-sm text-foreground-light">Unsupported integration type</p>
        </ScaffoldSection>
      </ScaffoldContainer>
    )
  }

  return (
    <>
      <RequiredExtensionsSection />
      <AddNewWrapperCTA />
      {isInstalled && <WrapperOverviewContent />}
    </>
  )
}

export const WrapperOverviewTab = () => {
  const isMarketplaceEnabled = useIsMarketplaceEnabled()

  if (isMarketplaceEnabled) return <RequiredExtensionsSection />

  return (
    <IntegrationOverviewTab actions={<AddNewWrapperCTA />}>
      <div className="mx-10">
        <WrapperOverviewContent />
      </div>
    </IntegrationOverviewTab>
  )
}
