import { SupportCategories } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { ExternalLink, Info } from 'lucide-react'
import Link from 'next/link'
import { SetStateAction } from 'react'
import { toast } from 'sonner'
import { number, object } from 'yup'

import { useParams } from 'common'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { useProjectDiskResizeMutation } from 'data/config/project-disk-resize-mutation'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Form,
  InfoIcon,
  InputNumber,
  Modal,
  WarningIcon,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export interface DiskSizeConfigurationProps {
  visible: boolean
  hideModal: (value: SetStateAction<boolean>) => void
  loading: boolean
}

const DiskSizeConfigurationModal = ({
  visible,
  loading,
  hideModal,
}: DiskSizeConfigurationProps) => {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: project, isPending: isLoadingProject } = useSelectedProjectQuery()
  const { lastDatabaseResizeAt } = project ?? {}

  const { data: projectSubscriptionData, isPending: isLoadingSubscription } =
    useOrgSubscriptionQuery({ orgSlug: organization?.slug }, { enabled: visible })

  const isLoading = isLoadingProject || isLoadingSubscription

  const timeTillNextAvailableDatabaseResize =
    lastDatabaseResizeAt === null ? 0 : 6 * 60 - dayjs().diff(lastDatabaseResizeAt, 'minutes')
  const isAbleToResizeDatabase = timeTillNextAvailableDatabaseResize <= 0
  const formattedTimeTillNextAvailableResize =
    timeTillNextAvailableDatabaseResize < 60
      ? `${timeTillNextAvailableDatabaseResize} minute(s)`
      : `${Math.floor(timeTillNextAvailableDatabaseResize / 60)} hours and ${
          timeTillNextAvailableDatabaseResize % 60
        } minute(s)`

  const { mutate: updateProjectUsage, isPending: isUpdatingDiskSize } =
    useProjectDiskResizeMutation({
      onSuccess: (res, variables) => {
        toast.success(`Successfully updated disk size to ${variables.volumeSize} GB`)
        hideModal(false)
      },
    })

  const confirmResetDbPass = async (values: { [prop: string]: any }) => {
    if (!projectRef) return console.error('Project ref is required')
    const volumeSize = values['new-disk-size']
    updateProjectUsage({ projectRef, volumeSize })
  }

  const currentDiskSize = project?.volumeSizeGb ?? 0

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
    <Modal
      header="Increase Disk Storage Size"
      size="medium"
      visible={visible}
      loading={loading}
      onCancel={() => hideModal(false)}
      hideFooter
    >
      {isLoading ? (
        <div className="flex flex-col gap-4 p-4">
          <ShimmeringLoader />
          <ShimmeringLoader />
        </div>
      ) : projectSubscriptionData?.usage_billing_enabled === true ? (
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
                    <SupportLink
                      queryParams={{
                        projectRef,
                        category: SupportCategories.PERFORMANCE_ISSUES,
                        subject: 'Increase disk size beyond 200GB',
                      }}
                    >
                      Contact support
                    </SupportLink>
                  </Button>
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            ) : (
              <>
                <Modal.Content className="w-full space-y-4">
                  <Alert_Shadcn_ variant={isAbleToResizeDatabase ? 'default' : 'warning'}>
                    <Info size={16} />
                    <AlertTitle_Shadcn_>
                      This operation is only possible every 4 hours
                    </AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      <div className="mb-4">
                        {isAbleToResizeDatabase
                          ? `Upon updating your disk size, the next disk size update will only be available from ${dayjs().format(
                              'DD MMM YYYY, HH:mm (ZZ)'
                            )}`
                          : `Your database was last resized at ${dayjs(lastDatabaseResizeAt).format(
                              'DD MMM YYYY, HH:mm (ZZ)'
                            )}. You can resize your database again in approximately ${formattedTimeTillNextAvailableResize}`}
                      </div>
                      <Button asChild type="default" iconRight={<ExternalLink size={14} />}>
                        <Link href={`${DOCS_URL}/guides/platform/database-size#disk-management`}>
                          Read more about disk management
                        </Link>
                      </Button>
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
                  <Button type="default" onClick={() => hideModal(false)}>
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
      ) : (
        <Alert_Shadcn_ className="border-none">
          <InfoIcon />
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
    </Modal>
  )
}

export default DiskSizeConfigurationModal
