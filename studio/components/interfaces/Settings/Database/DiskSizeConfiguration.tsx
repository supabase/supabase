import dayjs from 'dayjs'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useState } from 'react'
import { Alert, Button, Form, InputNumber, Modal } from 'ui'
import { number, object } from 'yup'

import { useParams } from 'common/hooks'
import { FormHeader } from 'components/ui/Forms'
import Panel from 'components/ui/Panel'
import { useProjectDiskResizeMutation } from 'data/config/project-disk-resize-mutation'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useProjectUsageQuery } from 'data/usage/project-usage-query'
import { useCheckPermissions, useStore } from 'hooks'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'

export interface DiskSizeConfigurationProps {
  disabled?: boolean
}

const DiskSizeConfiguration = ({ disabled = false }: DiskSizeConfigurationProps) => {
  const { ui } = useStore()
  const { project } = useProjectContext()
  const { ref: projectRef } = useParams()
  const { lastDatabaseResizeAt } = project ?? {}

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
  const canUpdateDiskSizeConfig = useCheckPermissions(PermissionAction.UPDATE, 'projects')

  const { data: projectUsage } = useProjectUsageQuery({ projectRef })
  const { data: projectSubscriptionData } = useProjectSubscriptionV2Query({ projectRef })
  const { mutate: updateProjectUsage, isLoading: isUpdatingDiskSize } =
    useProjectDiskResizeMutation({
      onSuccess: (res, variables) => {
        ui.setNotification({
          category: 'success',
          message: `Successfully updated disk size to ${variables.volumeSize} GB`,
        })
        setShowResetDbPass(false)
      },
    })

  const confirmResetDbPass = async (values: { [prop: string]: any }) => {
    if (!projectRef) return console.error('Project ref is required')
    const volumeSize = values['new-disk-size']
    updateProjectUsage({ projectRef, volumeSize })
  }

  const currentDiskSize = projectUsage?.disk_volume_size_gb ?? 0
  // to do, update with max_disk_volume_size_gb
  const maxDiskSize = 200

  const INITIAL_VALUES = {
    'new-disk-size': currentDiskSize,
  }

  const diskSizeValidationSchema = object({
    'new-disk-size': number()
      .required('Please enter a GB amount you want to resize the disk up to.')
      .moreThan(Number(currentDiskSize ?? 0), `Must be more than ${currentDiskSize} GB`)
      // to do, update with max_disk_volume_size_gb
      .lessThan(Number(maxDiskSize), 'Must be no more than 200 GB'),
  })

  return (
    <div id="diskManagement">
      <FormHeader title="Disk management" />
      {projectSubscriptionData?.plan.id !== 'free' ? (
        <div className="flex flex-col gap-3">
          <Panel className="!m-0">
            <Panel.Content>
              <div className="grid grid-cols-1 items-center lg:grid-cols-3">
                <div className="col-span-2 space-y-1">
                  {projectUsage?.disk_volume_size_gb && (
                    <span className="text-scale-1100 flex gap-2 items-baseline">
                      <span className="text-scale-1200">Current Disk Storage Size:</span>
                      <span className="text-scale-1200 text-xl">
                        {currentDiskSize}
                        <span className="text-scale-1200 text-sm">GB</span>
                      </span>
                    </span>
                  )}
                  <p className="text-sm opacity-50">
                    Supabase employs auto-scaling storage and allows for manual disk size <br />{' '}
                    adjustments when necessary
                  </p>
                </div>
                <div className="flex items-end justify-end">
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger>
                      <Button
                        type="default"
                        disabled={!canUpdateDiskSizeConfig || disabled}
                        onClick={() => setShowResetDbPass(true)}
                      >
                        Increase disk size
                      </Button>
                    </Tooltip.Trigger>
                    {!canUpdateDiskSizeConfig && (
                      <Tooltip.Portal>
                        <Tooltip.Content side="bottom">
                          <Tooltip.Arrow className="radix-tooltip-arrow" />
                          <div
                            className={[
                              'rounded bg-scale-100 py-1 px-2 leading-none shadow', // background
                              'border border-scale-200 ', //border
                            ].join(' ')}
                          >
                            <span className="text-xs text-scale-1200">
                              You need additional permissions to increase the disk size
                            </span>
                          </div>
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    )}
                  </Tooltip.Root>
                </div>
              </div>
            </Panel.Content>
          </Panel>
          <Alert withIcon variant="info" title={'Importing a lot of data?'}>
            <p className=" max-w-2xl">
              We auto-scale your disk as you need more storage, but can only do this every 6 hours.
              If you upload more than 1.5x the current size of your storage, your database will go
              into read-only mode. If you know how big your database is going to be, you can
              manually increase the size here.
            </p>

            <p className="mt-4">
              Read more about{' '}
              <a
                className="underline"
                href="https://supabase.com/docs/guides/platform/database-size#disk-management"
              >
                disk management
              </a>
              .
            </p>
          </Alert>
        </div>
      ) : (
        <Alert
          withIcon
          variant="info"
          title={'Disk size configuration is not available for projects on the Free plan'}
          actions={
            <Link href={`/project/${projectRef}/settings/billing/subscription`}>
              <Button type="default">Upgrade subscription</Button>
            </Link>
          }
        >
          <div>
            If you are intending to use more than 500MB of disk space, then you will need to upgrade
            to at least the Pro plan.
          </div>
        </Alert>
      )}

      <Modal
        header={<h5 className="text-sm text-scale-1200">Increase Disk Storage Size</h5>}
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
              <>
                <Alert withIcon variant="warning" title="Maximum manual disk size increase reached">
                  You cannot manually expand the disk size any more than {maxDiskSize} GB. If you
                  need more than this, contact us to learn more about the Enterprise plan.
                </Alert>
              </>
            ) : (
              <>
                <Modal.Content>
                  <div className="w-full space-y-4 py-6">
                    <Alert
                      withIcon
                      variant={isAbleToResizeDatabase ? 'info' : 'warning'}
                      title="This operation is only possible every 6 hours"
                    >
                      {isAbleToResizeDatabase
                        ? `Upon updating your disk size, the next disk size update will only be available from ${dayjs().format(
                            'DD MMM YYYY, HH:mm (ZZ)'
                          )}`
                        : `Your database was last resized at ${dayjs(lastDatabaseResizeAt).format(
                            'DD MMM YYYY, HH:mm (ZZ)'
                          )}. You can resize your database again in approximately ${formattedTimeTillNextAvailableResize}`}
                    </Alert>
                    <InputNumber
                      required
                      id="new-disk-size"
                      label="New disk size"
                      labelOptional="GB"
                      disabled={!isAbleToResizeDatabase}
                    />
                  </div>
                </Modal.Content>
                <Modal.Separator />
                <Modal.Content>
                  <div className="flex space-x-2 justify-end pt-1 pb-3">
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
                  </div>
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
