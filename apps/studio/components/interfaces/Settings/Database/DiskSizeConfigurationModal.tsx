import { zodResolver } from '@hookform/resolvers/zod'
import { SupportCategories } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { ExternalLink, Info } from 'lucide-react'
import Link from 'next/link'
import { SetStateAction, useEffect, useMemo } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormInputGroupInput,
  InfoIcon,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  WarningIcon,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { COOLDOWN_DURATION } from '@/data/config/disk-attributes-update-mutation'
import { useProjectDiskResizeMutation } from '@/data/config/project-disk-resize-mutation'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

export interface DiskSizeConfigurationProps {
  visible: boolean
  hideModal: (value: SetStateAction<boolean>) => void
  loading: boolean
}

const formId = 'disk-size-form'
const maxDiskSize = 200

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

  const { hasAccess: hasAccessToDiskModifications, isLoading: isLoadingDiskEntitlement } =
    useCheckEntitlements('instances.disk_modifications')

  const isLoading = isLoadingProject || isLoadingSubscription || isLoadingDiskEntitlement

  // COOLDOWN_DURATION is in seconds; convert to minutes to match the diff unit below.
  const cooldownMinutes = COOLDOWN_DURATION / 60
  const timeTillNextAvailableDatabaseResize =
    lastDatabaseResizeAt == null
      ? 0
      : Math.max(0, cooldownMinutes - dayjs().diff(lastDatabaseResizeAt, 'minutes'))
  const isAbleToResizeDatabase = timeTillNextAvailableDatabaseResize <= 0
  const formattedTimeTillNextAvailableResize =
    timeTillNextAvailableDatabaseResize < 60
      ? `${timeTillNextAvailableDatabaseResize} minute(s)`
      : `${Math.floor(timeTillNextAvailableDatabaseResize / 60)} hours and ${
          timeTillNextAvailableDatabaseResize % 60
        } minute(s)`

  const { mutate: updateProjectUsage, isPending: isUpdatingDiskSize } =
    useProjectDiskResizeMutation({
      onSuccess: (_res, variables) => {
        toast.success(`Successfully updated disk size to ${variables.volumeSize} GB`)
        hideModal(false)
      },
    })

  const currentDiskSize = project?.volumeSizeGb ?? 0

  const INITIAL_VALUES = useMemo(
    () => ({
      'new-disk-size': currentDiskSize,
    }),
    [currentDiskSize]
  )

  const diskSizeValidationSchema = useMemo(
    () =>
      z.object({
        'new-disk-size': z
          .union([
            z.literal(''),
            z.coerce
              .number()
              .min(Number(currentDiskSize ?? 0), `Must be at least ${currentDiskSize} GB`)
              // to do, update with max_disk_volume_size_gb
              .max(Number(maxDiskSize), `Must not be more than ${maxDiskSize} GB`),
          ])
          .refine(
            (value) => value !== '',
            'Please enter a GB amount you want to resize the disk up to'
          ),
      }),
    [currentDiskSize]
  )

  const handleSubmit: SubmitHandler<z.infer<typeof diskSizeValidationSchema>> = async (values) => {
    if (!projectRef) return console.error('Project ref is required')
    const volumeSize = values['new-disk-size']
    updateProjectUsage({ projectRef, volumeSize })
  }

  const form = useForm<z.infer<typeof diskSizeValidationSchema>>({
    resolver: zodResolver(diskSizeValidationSchema),
    defaultValues: INITIAL_VALUES,
  })
  const { reset, formState } = form
  const { isDirty } = formState

  useEffect(() => {
    if (isDirty) return
    reset(INITIAL_VALUES)
  }, [INITIAL_VALUES, isDirty, reset])

  return (
    <Dialog open={visible} onOpenChange={(open) => hideModal(open)}>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Increase Disk Storage Size</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        {isLoading ? (
          <div className="flex flex-col gap-4 p-4">
            <ShimmeringLoader />
            <ShimmeringLoader />
          </div>
        ) : projectSubscriptionData?.usage_billing_enabled === true &&
          hasAccessToDiskModifications ? (
          <>
            {currentDiskSize >= maxDiskSize ? (
              <Alert variant="warning" className="rounded-t-none border-0">
                <WarningIcon />
                <AlertTitle>Maximum manual disk size increase reached</AlertTitle>
                <AlertDescription>
                  <p>
                    You cannot manually expand the disk size any more than {maxDiskSize}GB. If you
                    need more than this, contact us via support for help.
                  </p>
                  <Button asChild variant="default" className="mt-3">
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
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <DialogSection className="w-full space-y-4">
                  <Alert variant={isAbleToResizeDatabase ? 'default' : 'warning'}>
                    <Info size={16} />
                    <AlertTitle>
                      Disk modifications are limited to 4 per rolling 24-hour window
                    </AlertTitle>
                    <AlertDescription>
                      <div className="mb-4">
                        {isAbleToResizeDatabase
                          ? `You can modify disk attributes up to 4 times within a rolling 24-hour window. A new modification can be started as soon as the previous one completes.`
                          : `Your database was last resized at ${dayjs(lastDatabaseResizeAt).format(
                              'DD MMM YYYY, HH:mm (ZZ)'
                            )}. You've reached the disk modification limit for now — you can resize again in approximately ${formattedTimeTillNextAvailableResize}.`}
                      </div>
                      <Button asChild variant="default" iconRight={<ExternalLink size={14} />}>
                        <Link href={`${DOCS_URL}/guides/platform/database-size#disk-management`}>
                          Read more about disk management
                        </Link>
                      </Button>
                    </AlertDescription>
                  </Alert>
                  <Form {...form}>
                    <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} noValidate>
                      <FormField
                        control={form.control}
                        name="new-disk-size"
                        disabled={!isAbleToResizeDatabase}
                        render={({ field }) => (
                          <FormItemLayout
                            name="new-disk-size"
                            layout="vertical"
                            label="New disk size"
                          >
                            <FormControl>
                              <InputGroup>
                                <FormInputGroupInput {...field} id="new-disk-size" type="number" />
                                <InputGroupAddon align="inline-end">
                                  <InputGroupText>GB</InputGroupText>
                                </InputGroupAddon>
                              </InputGroup>
                            </FormControl>
                          </FormItemLayout>
                        )}
                      />
                    </form>
                  </Form>
                </DialogSection>
                <DialogFooter>
                  <Button variant="default" onClick={() => hideModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    form={formId}
                    type="submit"
                    variant="primary"
                    disabled={!isAbleToResizeDatabase || isUpdatingDiskSize || !isDirty || loading}
                    loading={isUpdatingDiskSize || loading}
                  >
                    Update disk size
                  </Button>
                </DialogFooter>
              </>
            )}
          </>
        ) : (
          <Alert className="border-none">
            <InfoIcon />
            <AlertTitle>
              {hasAccessToDiskModifications === false
                ? 'Disk size configuration is not available for projects on the Free Plan'
                : 'Disk size configuration is only available when the spend cap has been disabled'}
            </AlertTitle>
            <AlertDescription>
              {hasAccessToDiskModifications === false ? (
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
              <Button asChild variant="default" className="mt-3">
                <Link
                  href={`/org/${organization?.slug}/billing?panel=${
                    hasAccessToDiskModifications === false ? 'subscriptionPlan' : 'costControl'
                  }`}
                  target="_blank"
                >
                  {hasAccessToDiskModifications === false
                    ? 'Upgrade subscription'
                    : 'Disable spend cap'}
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default DiskSizeConfigurationModal
