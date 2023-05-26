import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common/hooks'
import { FormHeader } from 'components/ui/Forms'
import Panel from 'components/ui/Panel'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { useProjectUsageQuery } from 'data/usage/project-usage-query'
import { checkPermissions, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import Link from 'next/link'
import { FC, useEffect, useState } from 'react'
import { Alert, Button, Form, InputNumber, Modal } from 'ui'
import { number, object } from 'yup'

const DiskSizeConfiguration: FC<any> = ({ disabled = false }) => {
  const { ui, app, meta } = useStore()
  const { ref } = useParams()

  const canUpdateDiskSizeConfig = checkPermissions(PermissionAction.UPDATE, 'projects')

  const [showResetDbPass, setShowResetDbPass] = useState<boolean>(false)
  const [isUpdatingDiskSize, setIsUpdatingDiskSize] = useState<boolean>(false)

  const {
    data: projectUsage,
    error: projectUsageError,
    isLoading: projectUsageLoading,
  } = useProjectUsageQuery({ projectRef: ref })

  const { data: projectSubscriptionData } = useProjectSubscriptionQuery({ projectRef: ref })

  console.log('projectSubscriptionData', projectSubscriptionData)

  useEffect(() => {
    if (showResetDbPass) {
      setIsUpdatingDiskSize(false)
    }
  }, [showResetDbPass])

  const confirmResetDbPass = async (values: { [prop: string]: any }) => {
    if (!ref) return

    try {
      setIsUpdatingDiskSize(true)
      const res = await post(`${API_URL}/projects/${ref}/resize`, {
        volume_size_gb: values['new-disk-size'],
      })

      if (res.error) {
        throw res.error
      } else {
        await app.projects.fetchDetail(ref, (project) => meta.setProjectDetails(project))
        ui.setNotification({
          category: 'success',
          message: `Succesfully updated disk size to ${values['new-disk-size']} GB`,
        })
        setShowResetDbPass(false)
      }

      setIsUpdatingDiskSize(false)
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: error.message })
      setIsUpdatingDiskSize(false)
    }
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
    <div>
      <FormHeader title="Disk management" />
      {projectSubscriptionData?.tier.supabase_prod_id != 'tier_free' ? (
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
                    Supabase uses network-attached storage to balance performance with scalability.
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
          <Alert withIcon variant="info" title={'Importing a lot of data'}>
            If you intend to import a lot of data into your database which requires multiple disk
            expansions then reach out to our team. For example, uploading more than 1.5x the current
            size of your database storage will put your database into read-only mode.
          </Alert>
        </div>
      ) : (
        <Alert
          withIcon
          variant="info"
          title={'DB disk size config not available for free tier project'}
          actions={
            <Link href={`/project/${ref}/settings/billing/subscription`}>
              <Button type="default">Upgrade subscription</Button>
            </Link>
          }
        >
          <div>
            If you are intending to use more than 500MB of disk space, then you will need to upgrade
            to at least the Pro tier.
          </div>
        </Alert>
      )}

      <Modal
        header={<h5 className="text-sm text-scale-1200">Increase Disk Storage Size</h5>}
        size="small"
        visible={showResetDbPass}
        loading={isUpdatingDiskSize}
        onCancel={() => setShowResetDbPass(false)}
        hideFooter
      >
        <Form
          name={`disk-resize-form`}
          initialValues={INITIAL_VALUES}
          validationSchema={diskSizeValidationSchema}
          onSubmit={confirmResetDbPass}
        >
          {({ isSubmitting }: { isSubmitting: boolean }) =>
            currentDiskSize >= maxDiskSize ? (
              <>
                <Alert
                  withIcon
                  variant="warning"
                  title={'Maximum manual disk size increase reached'}
                >
                  You cannot manually expand the disk size any more than {maxDiskSize} GB. If you
                  need more than this, contact us to learn more about the Enterprise plan.
                </Alert>
              </>
            ) : (
              <>
                <Modal.Content>
                  <div className="w-full space-y-8 py-8">
                    <InputNumber
                      id="new-disk-size"
                      label="New disk size"
                      labelOptional="GB"
                      required
                    />
                  </div>
                </Modal.Content>
                <Modal.Separator />
                <Modal.Content>
                  <div className="flex space-x-2 justify-between pb-2">
                    <Button type="default" onClick={() => setShowResetDbPass(false)}>
                      Cancel
                    </Button>
                    <Button htmlType="submit" type="primary" loading={isSubmitting}>
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
