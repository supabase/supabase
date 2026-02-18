import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ExternalLink, Info } from 'lucide-react'
import Link from 'next/link'
import { SetStateAction } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import DiskSizeConfigurationModal from 'components/interfaces/Settings/Database/DiskSizeConfigurationModal'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import Panel from 'components/ui/Panel'
import { useProjectDiskResizeMutation } from 'data/config/project-disk-resize-mutation'
import { useDatabaseSizeQuery } from 'data/database/database-size-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useIsAwsNimbusCloudProvider, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useUrlState } from 'hooks/ui/useUrlState'
import { DOCS_URL } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button, InfoIcon } from 'ui'
import { DocsButton } from 'components/ui/DocsButton'
import {
  PageSection,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
  PageSectionContent,
} from 'ui-patterns'

export interface DiskSizeConfigurationProps {
  disabled?: boolean
}

const DiskSizeConfiguration = ({ disabled = false }: DiskSizeConfigurationProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const isAwsNimbus = useIsAwsNimbusCloudProvider()
  const { reportsAll } = useIsFeatureEnabled(['reports:all'])

  const [{ show_increase_disk_size_modal }, setUrlParams] = useUrlState()
  const showIncreaseDiskSizeModal = show_increase_disk_size_modal === 'true'
  const setShowIncreaseDiskSizeModal = (value: SetStateAction<boolean>) => {
    const show = typeof value === 'function' ? value(showIncreaseDiskSizeModal) : value
    setUrlParams({ show_increase_disk_size_modal: show ? 'true' : undefined })
  }

  const { can: canUpdateDiskSizeConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const { isPending: isUpdatingDiskSize } = useProjectDiskResizeMutation({
    onSuccess: (_, variables) => {
      toast.success(`Successfully updated disk size to ${variables.volumeSize} GB`)
      setShowIncreaseDiskSizeModal(false)
    },
  })

  const currentDiskSize = project?.volumeSizeGb ?? 0

  const { data } = useDatabaseSizeQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const databaseSizeBytesUsed = data ?? 0

  return (
    <>
      <PageSection id="disk-management">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Disk Management</PageSectionTitle>
          </PageSectionSummary>
          <DocsButton href={`${DOCS_URL}/guides/platform/database-size#disk-management`} />
        </PageSectionMeta>
        <PageSectionContent>
          {organization?.usage_billing_enabled === true ? (
            <div className="flex flex-col gap-3">
              <Panel className="!m-0">
                <Panel.Content>
                  <div>
                    <div>
                      {currentDiskSize && (
                        <span className="text-foreground-light flex gap-2 items-baseline">
                          <h4 className="text-foreground">Current Disk Storage</h4>
                        </span>
                      )}
                      <div className="grid grid-cols-2 items-center">
                        <p className="text-sm text-lighter max-w-lg">
                          Supabase employs auto-scaling storage and allows for manual disk size
                          adjustments when necessary
                        </p>
                        {!isAwsNimbus && (
                          <ButtonTooltip
                            type="default"
                            className="w-min ml-auto"
                            disabled={!canUpdateDiskSizeConfig || disabled}
                            onClick={() => setShowIncreaseDiskSizeModal(true)}
                            tooltip={{
                              content: {
                                side: 'bottom',
                                text: !canUpdateDiskSizeConfig
                                  ? 'You need additional permissions to increase the disk size'
                                  : undefined,
                              },
                            }}
                          >
                            Increase disk size
                          </ButtonTooltip>
                        )}
                      </div>

                      <div className="grid grid-cols-12 gap-2 mt-12 items-start">
                        <div className="col-span-4 grid grid-cols-2 gap-x-12 gap-y-4 items-start">
                          <div className="grid gap-2 col-span-1">
                            <h5>Space used</h5>
                            <span className="text-lg">
                              {formatBytes(databaseSizeBytesUsed, 2, 'GB')}
                            </span>
                          </div>
                          <div className="grid gap-2 col-span-1">
                            <h5>Total size</h5>
                            <span className="text-lg">{currentDiskSize} GB</span>
                          </div>

                          {reportsAll && (
                            <div className="col-span-2 mt-4">
                              <Button asChild type="default" iconRight={<ExternalLink size={14} />}>
                                <Link
                                  href={`/project/${projectRef}/reports/database#database-size-report`}
                                >
                                  View detailed summary
                                </Link>
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="col-span-8">
                          <Alert_Shadcn_>
                            <Info size={16} />
                            <AlertTitle_Shadcn_>Importing a lot of data?</AlertTitle_Shadcn_>
                            <AlertDescription_Shadcn_>
                              <Markdown
                                className="max-w-full"
                                content={`
We auto-scale your disk as you need more storage, but can only do this once every 4 hours.
If you upload more than 1.5x the current size of your storage, your database will go
into read-only mode. If you know how big your database is going to be, you can
manually increase the size here.

Read more about [disk management](${DOCS_URL}/guides/platform/database-size#disk-management) and how to [free up storage space](${DOCS_URL}/guides/platform/database-size#vacuum-operations).
`}
                              />
                            </AlertDescription_Shadcn_>
                          </Alert_Shadcn_>
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel.Content>
              </Panel>
            </div>
          ) : (
            <Alert_Shadcn_>
              <InfoIcon />
              <AlertTitle_Shadcn_>
                {organization?.plan?.id === 'free'
                  ? 'Disk size configuration is not available for projects on the Free Plan'
                  : 'Disk size configuration is only available when the spend cap has been disabled'}
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                {organization?.plan?.id === 'free' ? (
                  <p>
                    If you are intending to use more than 500MB of disk space, then you will need to
                    upgrade to at least the Pro Plan.
                  </p>
                ) : (
                  <p>
                    If you are intending to use more than 8GB of disk space, then you will need to
                    disable your spend cap.
                  </p>
                )}
                <Button asChild type="default" className="mt-3">
                  <Link
                    href={`/org/${organization?.slug}/billing?panel=${
                      organization?.plan?.id === 'free' ? 'subscriptionPlan' : 'costControl'
                    }`}
                    target="_blank"
                  >
                    {organization?.plan?.id === 'free'
                      ? 'Upgrade subscription'
                      : 'Disable spend cap'}
                  </Link>
                </Button>
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}
        </PageSectionContent>
      </PageSection>

      <DiskSizeConfigurationModal
        visible={showIncreaseDiskSizeModal}
        loading={isUpdatingDiskSize}
        hideModal={setShowIncreaseDiskSizeModal}
      />
    </>
  )
}

export default DiskSizeConfiguration
