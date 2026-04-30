import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useFlag, useParams } from 'common'
import Link from 'next/link'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useState } from 'react'
import { Button, Sheet, SheetContent } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import { IntegrationOverviewTabV2 } from '../Integration/IntegrationOverviewTabV2'
import { useAvailableIntegrations } from '../Landing/useAvailableIntegrations'
import { CreateIcebergWrapperSheet } from './CreateIcebergWrapperSheet'
import { CreateWrapperSheet } from './CreateWrapperSheet'
import { WRAPPERS } from './Wrappers.constants'
import { WrapperTable } from './WrapperTable'
import { ScaffoldContainer, ScaffoldSection } from '@/components/layouts/Scaffold'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'

const WrapperOverviewContent = () => {
  const { id } = useParams()
  const wrapperMeta = WRAPPERS.find((w) => w.name === id)

  const [isDirty, setIsDirty] = useState(false)
  const [createWrapperShown, setCreateWrapperShown] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const { confirmOnClose, handleOpenChange, modalProps } = useConfirmOnClose({
    checkIsDirty: () => isDirty,
    onClose: () => {
      setCreateWrapperShown(false)
      setIsDirty(false)
    },
  })

  // [Joshen] Opting to declare custom wrapper sheets here instead of within Wrappers.constants.ts
  // as we'll easily run into circular dependencies doing so unfortunately
  const CreateWrapperSheetComponent = !wrapperMeta
    ? null
    : wrapperMeta.customComponent
      ? wrapperMeta.name === 'iceberg_wrapper'
        ? CreateIcebergWrapperSheet
        : null
      : CreateWrapperSheet

  return (
    <>
      <div className="flex flex-col gap-y-5">
        <p>Recent wrappers</p>
        <WrapperTable />
      </div>

      {!!CreateWrapperSheetComponent && !!wrapperMeta && (
        <Sheet open={!!createWrapperShown} onOpenChange={handleOpenChange}>
          <SheetContent size="lg" tabIndex={undefined}>
            <CreateWrapperSheetComponent
              wrapperMeta={wrapperMeta}
              onDirty={setIsDirty}
              onClose={() => setCreateWrapperShown(false)}
              onCloseWithConfirmation={confirmOnClose}
            />
          </SheetContent>
        </Sheet>
      )}

      <DiscardChangesConfirmationDialog {...modalProps} />
    </>
  )
}

const AddNewWrapperCTA = () => {
  const { id } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [, setCreateWrapperShown] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const { can: canCreateWrapper } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'wrappers'
  )

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
        <Button asChild type="default" className="w-min mt-3">
          <Link
            href={
              databaseNeedsUpgrading
                ? `/project/${project?.ref}/settings/infrastructure`
                : `/project/${project?.ref}/database/extensions?filter=wrappers`
            }
          >
            {databaseNeedsUpgrading ? 'Upgrade database' : 'View wrappers extension'}
          </Link>
        </Button>
      </Admonition>
    )
  }

  return (
    <div className="py-3 px-5 border rounded-md">
      <ButtonTooltip
        type="default"
        onClick={() => setCreateWrapperShown(true)}
        disabled={!canCreateWrapper}
        tooltip={{
          content: {
            text: !canCreateWrapper
              ? 'You need additional permissions to create a foreign data wrapper'
              : undefined,
          },
        }}
      >
        Add new wrapper
      </ButtonTooltip>
    </div>
  )
}

export const WrapperOverviewTab = () => {
  const { id } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const isMarketplaceEnabled = useFlag('marketplaceIntegrations')

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

  if (isMarketplaceEnabled) {
    return (
      <IntegrationOverviewTabV2>
        {isInstalled && (
          <>
            <AddNewWrapperCTA />
            <WrapperOverviewContent />
          </>
        )}
      </IntegrationOverviewTabV2>
    )
  } else {
    return (
      <IntegrationOverviewTab actions={<AddNewWrapperCTA />}>
        <div className="mx-10">
          <WrapperOverviewContent />
        </div>
      </IntegrationOverviewTab>
    )
  }
}
