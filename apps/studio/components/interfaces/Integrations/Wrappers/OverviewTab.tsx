import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Separator,
  Sheet,
  SheetContent,
  WarningIcon,
} from 'ui'
import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import { INTEGRATIONS } from '../Landing/Integrations.constants'
import { CreateWrapperSheet } from './CreateWrapperSheet'
import { WrapperTable } from './WrapperTable'

export const WrapperOverviewTab = () => {
  const { id } = useParams()
  const { project } = useProjectContext()
  const [createWrapperShown, setCreateWrapperShown] = useState(false)
  const [isClosingCreateWrapper, setisClosingCreateWrapper] = useState(false)
  const canCreateWrapper = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'wrappers')

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const integration = INTEGRATIONS.find((i) => i.id === id)

  if (integration?.type !== 'wrapper') {
    return <p className="text-sm text-foreground-light">Unsupported integration type</p>
  }

  const wrapperMeta = integration.meta
  const wrappersExtension = data?.find((ext) => ext.name === 'wrappers')
  const isWrappersExtensionInstalled = !!wrappersExtension?.installed_version
  const hasRequiredVersion =
    (wrappersExtension?.installed_version ?? '') >= (wrapperMeta?.minimumExtensionVersion ?? '')
  const databaseNeedsUpgrading =
    wrappersExtension?.installed_version !== wrappersExtension?.default_version

  return (
    <IntegrationOverviewTab
      actions={
        isWrappersExtensionInstalled && !hasRequiredVersion ? (
          <div className="">
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
                  disabling and enabling the <code className="text-xs">wrappers</code> extension to
                  create this wrapper.
                </p>
                <p className="text-warning">
                  Warning: Before reinstalling the wrapper extension, you must first remove all
                  existing wrappers. Afterward, you can recreate the wrappers.
                </p>
              </AlertDescription_Shadcn_>
              <AlertDescription_Shadcn_ className="mt-3">
                <Button asChild type="default">
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
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          </div>
        ) : (
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
    >
      <div className="mx-10 flex flex-col gap-5">
        Recent wrappers
        <WrapperTable />
      </div>
      <Separator />
      <Sheet open={!!createWrapperShown} onOpenChange={() => setisClosingCreateWrapper(true)}>
        <SheetContent size="lg" tabIndex={undefined}>
          <CreateWrapperSheet
            wrapperMeta={integration.meta}
            onClose={() => {
              setCreateWrapperShown(false)
              setisClosingCreateWrapper(false)
            }}
            isClosing={isClosingCreateWrapper}
            setIsClosing={setisClosingCreateWrapper}
          />
        </SheetContent>
      </Sheet>
    </IntegrationOverviewTab>
  )
}
