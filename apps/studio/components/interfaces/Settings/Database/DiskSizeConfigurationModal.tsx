import type { SetStateAction } from 'react'
import Link from 'next/link'
import { ExternalLink, Info } from 'lucide-react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { PermissionAction, SupportCategories } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { useProjectDiskResizeMutation } from 'data/config/project-disk-resize-mutation'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  InfoIcon,
  Input_Shadcn_,
  WarningIcon,
} from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'

export interface DiskSizeConfigurationModalProps {
  disabled?: boolean
}

const formId = 'disk-resize-form'

export const DiskSizeConfigurationModal = ({ disabled = false }) => {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: project, isLoading: isLoadingProject } = useSelectedProjectQuery()
  const [visible, setVisible] = useQueryState(
    `show_increase_disk_size_modal`,
    parseAsBoolean.withDefault(false)
  )

  const { can: canUpdateDiskSizeConfig } = useAsyncCheckProjectPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const { mutate: updateProjectUsage, isLoading: isUpdatingDiskSize } =
    useProjectDiskResizeMutation({
      onSuccess: (_, variables) => {
        toast.success(`Successfully updated disk size to ${variables.volumeSize} GB`)
        setVisible(false)
      },
    })
  const minDiskSize = project?.volumeSizeGb ?? 0
  const maxDiskSize = 200
  const schema = z.object({
    volumeSize: z.coerce
      .number({ required_error: 'Please enter a GB amount you want to resize the disk up to.' })
      .min(minDiskSize, `Must be more than ${minDiskSize} GB`)
      // to do, update with max_disk_volume_size_gb
      .max(maxDiskSize, 'Must not be more than 200 GB'),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { volumeSize: minDiskSize },
  })
  const { lastDatabaseResizeAt } = project ?? {}

  const { data: projectSubscriptionData, isLoading: isLoadingSubscription } =
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

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async ({ volumeSize }) => {
    if (!projectRef) return console.error('Project ref is required')
    updateProjectUsage({ projectRef, volumeSize })
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          form.reset()
          setVisible(false)
        }
      }}
    >
      <DialogTrigger asChild>
        <ButtonTooltip
          type="default"
          disabled={!canUpdateDiskSizeConfig || disabled}
          onClick={() => setVisible(true)}
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
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Increase Disk Storage Size</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        {isLoading ? (
          <DialogSection className="flex flex-col gap-4 p-4">
            <ShimmeringLoader />
            <ShimmeringLoader />
          </DialogSection>
        ) : projectSubscriptionData?.usage_billing_enabled === true ? (
          minDiskSize >= maxDiskSize ? (
            <DialogSection>
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
                      href={`/support/new?projectRef=${projectRef}&category=${SupportCategories.PERFORMANCE_ISSUES}&subject=Increase%20disk%20size%20beyond%20200GB`}
                    >
                      Contact support
                    </Link>
                  </Button>
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            </DialogSection>
          ) : (
            <>
              <DialogSection>
                <Form_Shadcn_ {...form}>
                  <form
                    id={formId}
                    className="flex flex-col gap-4"
                    onSubmit={form.handleSubmit(onSubmit)}
                  >
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
                            : `Your database was last resized at ${dayjs(
                                lastDatabaseResizeAt
                              ).format(
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
                    <FormField_Shadcn_
                      key="volumeSize"
                      name="volumeSize"
                      control={form.control}
                      render={({ field }) => (
                        <FormItemLayout name="volumeSize" label="New disk size" labelOptional="GB">
                          <FormControl_Shadcn_>
                            <Input_Shadcn_
                              id="volumeSize"
                              type="number"
                              min={minDiskSize}
                              max={maxDiskSize}
                              required
                              disabled={!isAbleToResizeDatabase}
                              {...field}
                            />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />
                  </form>
                </Form_Shadcn_>
              </DialogSection>
              <DialogFooter>
                <Button
                  type="default"
                  onClick={() => {
                    form.reset()
                    setVisible(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  form={formId}
                  htmlType="submit"
                  disabled={!isAbleToResizeDatabase || isUpdatingDiskSize}
                  loading={isUpdatingDiskSize}
                >
                  Update disk size
                </Button>
              </DialogFooter>
            </>
          )
        ) : (
          <DialogSection>
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
                      projectSubscriptionData?.plan?.id === 'free'
                        ? 'subscriptionPlan'
                        : 'costControl'
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
          </DialogSection>
        )}
      </DialogContent>
    </Dialog>
  )
}
