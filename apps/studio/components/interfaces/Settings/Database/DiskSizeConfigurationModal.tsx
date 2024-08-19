import { SupportCategories } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { ExternalLink, Info } from 'lucide-react'
import Link from 'next/link'
import { SetStateAction } from 'react'
import toast from 'react-hot-toast'
import { number, object } from 'yup'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useProjectDiskResizeMutation } from 'data/config/project-disk-resize-mutation'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Form,
  InputNumber,
  Modal,
  WarningIcon,
} from 'ui'

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
  const { project } = useProjectContext()
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

  const { mutate: updateProjectUsage, isLoading: isUpdatingDiskSize } =
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
                      <Link href="https://supabase.com/docs/guides/platform/database-size#disk-management">
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
    </Modal>
  )
}

export default DiskSizeConfigurationModal
