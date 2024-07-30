import { PermissionAction, SupportCategories } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { Info } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { number, object } from 'yup'

import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import Panel from 'components/ui/Panel'
import { useProjectDiskResizeMutation } from 'data/config/project-disk-resize-mutation'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Form,
  InputNumber,
  Modal,
} from 'ui'
import { WarningIcon } from 'ui'

export interface DiskSizeConfigurationProps {
  disabled?: boolean
}

const DiskSizeConfiguration = ({ disabled = false }: DiskSizeConfigurationProps) => {
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const { lastDatabaseResizeAt } = project ?? {}

  const organization = useSelectedOrganization()

  const timeTillNextAvailableDatabaseResize =
    lastDatabaseResizeAt === null ? 0 : 6 * 60 - dayjs().diff(lastDatabaseResizeAt, 'minutes')
  const isAbleToResizeDatabase = timeTillNextAvailableDatabaseResize <= 0
  const formattedTimeTillNextAvailableResize =
    timeTillNextAvailableDatabaseResize < 60
      ? `${timeTillNextAvailableDatabaseResize} minute(s)`
      : `${Math.floor(timeTillNextAvailableDatabaseResize / 60)} hours and ${
          timeTillNextAvailableDatabaseResize % 60
        } minute(s)`

  const [showResetDbPass, setShowResetDbPass] = useState<boolean>(false)
  const canUpdateDiskSizeConfig = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  const { data: projectSubscriptionData } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const { mutate: updateProjectUsage, isLoading: isUpdatingDiskSize } =
    useProjectDiskResizeMutation({
      onSuccess: (res, variables) => {
        toast.success(`Successfully updated disk size to ${variables.volumeSize} GB`)
        setShowResetDbPass(false)
      },
    })

  const confirmResetDbPass = async (values: { [prop: string]: any }) => {
    if (!projectRef) return console.error('Project ref is required')
    const volumeSize = values['new-disk-size']
    updateProjectUsage({ projectRef, volumeSize })
  }

  const currentDiskSize = project?.volumeSizeGb ?? 0
  // to do, update with max_disk_volume_size_gb
  const maxDiskSize = 200

  const INITIAL_VALUES = {
    'new-disk-size': currentDiskSize,
  }

  const diskSizeValidationSchema = object({
    'new-disk-size': number()
      .required('Please enter a GB amount you want to resize the disk up to.')
      .min(Number(currentDiskSize ?? 0), `Must be more than ${currentDiskSize} GB`)
      // to do, update with max_disk_volume_size_gb
      .max(Number(maxDiskSize), 'Must not be more than 200 GB'),
  })

  return (
    <div id="diskManagement">
      <FormHeader title="Disk management" />
      {projectSubscriptionData?.usage_billing_enabled === true ? (
        <div className="flex flex-col gap-3">
          <Panel className="!m-0">
            <Panel.Content>
              <div className="grid grid-cols-1 items-center lg:grid-cols-3">
                <div className="col-span-2 space-y-1">
                  {currentDiskSize && (
                    <span className="text-foreground-light flex gap-2 items-baseline">
                      <span className="text-foreground">Current Disk Storage Size:</span>
                      <span className="text-foreground text-xl">
                        {currentDiskSize}
                        <span className="text-foreground text-sm">GB</span>
                      </span>
                    </span>
                  )}
                  <p className="text-sm opacity-50">
                    Supabase employs auto-scaling storage and allows for manual disk size
                    adjustments when necessary
                  </p>
                </div>
                <div className="flex items-end justify-end">
                  <ButtonTooltip
                    type="default"
                    disabled={!canUpdateDiskSizeConfig || disabled}
                    onClick={() => setShowResetDbPass(true)}
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
                </div>
              </div>
            </Panel.Content>
          </Panel>
          <Alert_Shadcn_>
            <Info size={16} />
            <AlertTitle_Shadcn_>Importing a lot of data?</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              <Markdown
                className="max-w-full"
                content={`
We auto-scale your disk as you need more storage, but can only do this every 6 hours.
If you upload more than 1.5x the current size of your storage, your database will go
into read-only mode. If you know how big your database is going to be, you can
manually increase the size here.

Read more about [disk management](https://supabase.com/docs/guides/platform/database-size#disk-management).
`}
              />
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </div>
      ) : (
        <Alert_Shadcn_>
          <Info size={16} />
          <AlertTitle_Shadcn_>
            {projectSubscriptionData?.plan?.id === 'free'
              ? 'Disk size configuration is not available for projects on the Free Plan'
              : 'Disk size configuration is only available when the spend cap has been disabled'}
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            {projectSubscriptionData?.plan?.id === 'free' ? (
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
                  projectSubscriptionData?.plan?.id === 'free' ? 'subscriptionPlan' : 'costControl'
                }`}
                target="_blank"
              >
                {projectSubscriptionData?.plan?.id === 'free'
                  ? 'Upgrade subscription'
                  : 'Disable spend cap'}
              </Link>
            </Button>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}

      <Modal
        header="Increase Disk Storage Size"
        size="medium"
        visible={showResetDbPass}
        loading={isUpdatingDiskSize}
        onCancel={() => setShowResetDbPass(false)}
        hideFooter
      >
        <Form
          name="disk-resize-form"
          initialValues={INITIAL_VALUES}
          validationSchema={diskSizeValidationSchema}
          onSubmit={confirmResetDbPass}
        >
          {() =>
            currentDiskSize >= maxDiskSize ? (
              <Alert_Shadcn_ variant="warning" className="rounded-t-none border-0">
                <WarningIcon />
                <AlertTitle_Shadcn_>Maximum manual disk size increase reached</AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  <p>
                    You cannot manually expand the disk size any more than {maxDiskSize}GB. If you
                    need more than this, contact us via support for help.
                  </p>
                  <Button asChild type="default" className="mt-3">
                    <Link
                      href={`/support/new?ref=${projectRef}&category=${SupportCategories.PERFORMANCE_ISSUES}&subject=Increase%20disk%20size%20beyond%20200GB`}
                    >
                      Contact support
                    </Link>
                  </Button>
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            ) : (
              <>
                <Modal.Content className="w-full space-y-4">
                  <Alert_Shadcn_ variant={isAbleToResizeDatabase ? 'default' : 'warning'}>
                    <Info size={16} />
                    <AlertTitle_Shadcn_>
                      This operation is only possible every 6 hours
                    </AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      {isAbleToResizeDatabase
                        ? `Upon updating your disk size, the next disk size update will only be available from ${dayjs().format(
                            'DD MMM YYYY, HH:mm (ZZ)'
                          )}`
                        : `Your database was last resized at ${dayjs(lastDatabaseResizeAt).format(
                            'DD MMM YYYY, HH:mm (ZZ)'
                          )}. You can resize your database again in approximately ${formattedTimeTillNextAvailableResize}`}
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                  <InputNumber
                    required
                    id="new-disk-size"
                    label="New disk size"
                    labelOptional="GB"
                    disabled={!isAbleToResizeDatabase}
                  />
                </Modal.Content>
                <Modal.Separator />
                <Modal.Content className="flex space-x-2 justify-end">
                  <Button type="default" onClick={() => setShowResetDbPass(false)}>
                    Cancel
                  </Button>
                  <Button
                    htmlType="submit"
                    type="primary"
                    disabled={!isAbleToResizeDatabase || isUpdatingDiskSize}
                    loading={isUpdatingDiskSize}
                  >
                    Update disk size
                  </Button>
                </Modal.Content>
              </>
            )
          }
        </Form>
      </Modal>
    </div>
  )
}

export default DiskSizeConfiguration
