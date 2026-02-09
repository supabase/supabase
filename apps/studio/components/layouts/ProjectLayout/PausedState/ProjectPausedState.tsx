import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { PauseCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useFlag, useParams } from 'common'
import {
  extractPostgresVersionDetails,
  PostgresVersionSelector,
} from 'components/interfaces/ProjectCreation/PostgresVersionSelector'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { InlineLinkClassName } from 'components/ui/InlineLink'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useSetProjectStatus } from 'data/projects/project-detail-query'
import { useProjectPauseStatusQuery } from 'data/projects/project-pause-status-query'
import { useProjectRestoreMutation } from 'data/projects/project-restore-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { usePHFlag } from 'hooks/ui/useFlag'
import { PROJECT_STATUS } from 'lib/constants'
import { AWS_REGIONS, CloudProvider } from 'shared-data'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  cn,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Form_Shadcn_,
  FormField_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { PauseDisabledState } from './PauseDisabledState'

export interface ProjectPausedStateProps {
  product?: string
}

export const ProjectPausedState = ({ product }: ProjectPausedStateProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { setProjectStatus } = useSetProjectStatus()

  const showPostgresVersionSelector = useFlag('showPostgresVersionSelector')
  const enableProBenefitWording = usePHFlag('proBenefitWording')

  const region = Object.values(AWS_REGIONS).find((x) => x.code === project?.region)

  const orgSlug = selectedOrganization?.slug
  const {
    data: pauseStatus,
    error: pauseStatusError,
    isError,
    isSuccess: isPauseStatusSuccess,
    isPending: isLoading,
  } = useProjectPauseStatusQuery({ ref }, { enabled: project?.status === PROJECT_STATUS.INACTIVE })

  const finalDaysRemainingBeforeRestoreDisabled =
    pauseStatus?.remaining_days_till_restore_disabled ??
    pauseStatus?.max_days_till_restore_disabled ??
    0

  const isFreePlan = selectedOrganization?.plan?.id === 'free'
  const isRestoreDisabled = isPauseStatusSuccess && !pauseStatus.can_restore

  const { data: membersExceededLimit } = useFreeProjectLimitCheckQuery(
    { slug: orgSlug },
    { enabled: isFreePlan }
  )

  const hasMembersExceedingFreeTierLimit = (membersExceededLimit || []).length > 0
  const [showConfirmRestore, setShowConfirmRestore] = useState(false)
  const [showFreeProjectLimitWarning, setShowFreeProjectLimitWarning] = useState(false)

  const { mutate: restoreProject, isPending: isRestoring } = useProjectRestoreMutation({
    onSuccess: (_, variables) => {
      setProjectStatus({ ref: variables.ref, status: PROJECT_STATUS.RESTORING })
      toast.success('Restoring project, project will be ready in a few minutes')
    },
  })

  const { can: canResumeProject } = useAsyncCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_jobs.projects.initialize_or_resume'
  )

  const onSelectRestore = () => {
    if (!canResumeProject) {
      toast.error('You do not have the required permissions to restore this project')
    } else if (hasMembersExceedingFreeTierLimit) setShowFreeProjectLimitWarning(true)
    else setShowConfirmRestore(true)
  }

  const onConfirmRestore = async (values: z.infer<typeof FormSchema>) => {
    if (!project) {
      return toast.error('Unable to restore: project is required')
    }

    if (!showPostgresVersionSelector) {
      restoreProject({ ref: project.ref })
    } else {
      const { postgresVersionSelection } = values

      const postgresVersionDetails = extractPostgresVersionDetails(postgresVersionSelection)

      restoreProject({
        ref: project.ref,
        releaseChannel: postgresVersionDetails.releaseChannel,
        postgresEngine: postgresVersionDetails.postgresEngine,
      })
    }
  }

  const FormSchema = z.object({
    postgresVersionSelection: z.string(),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: { postgresVersionSelection: '' },
  })

  return (
    <>
      <Card className="w-[40rem] mx-auto">
        <CardContent>
          <PauseCircle
            size={48}
            strokeWidth={1}
            className="text-foreground-lighter shrink-0 mb-4"
          />
          <div className="flex-1">
            <div>
              <h2 className="mb-4">The project "{project?.name}" is currently paused</h2>
              <div className="text-foreground-light max-w-4xl">
                {isLoading && <GenericSkeletonLoader className="mt-3" />}

                {isPauseStatusSuccess && !isRestoreDisabled ? (
                  isFreePlan ? (
                    <>
                      <p className="text-sm">
                        All data, including backups and storage objects, remains safe. You can
                        resume this project from the dashboard within{' '}
                        <Tooltip>
                          <TooltipTrigger>
                            <span className={cn(InlineLinkClassName, 'text-foreground')}>
                              {finalDaysRemainingBeforeRestoreDisabled} day
                              {finalDaysRemainingBeforeRestoreDisabled > 1 ? 's' : ''}
                            </span>{' '}
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="w-80 text-center">
                            Free projects cannot be restored through the dashboard if they are
                            paused for more than {pauseStatus.max_days_till_restore_disabled} days
                          </TooltipContent>
                        </Tooltip>{' '}
                        (until{' '}
                        <TimestampInfo
                          displayAs="local"
                          utcTimestamp={dayjs()
                            .utc()
                            .add(pauseStatus.remaining_days_till_restore_disabled ?? 0, 'day')
                            .toISOString()}
                          className="text-sm text-foreground"
                          labelFormat="DD MMM YYYY"
                        />
                        ). After that, this project will not be resumable, but data will still be
                        available for download.
                      </p>
                      <p className="text-sm mt-4">
                        {enableProBenefitWording === 'variant-a'
                          ? 'Upgrade to Pro to prevent pauses and unlock features like branching, compute upgrades, and daily backups.'
                          : 'To prevent future pauses, consider upgrading to Pro.'}
                      </p>
                      {!!pauseStatus.last_paused_on && (
                        <p className="text-foreground-lighter text-sm">
                          Project last paused on{' '}
                          <TimestampInfo
                            className="text-sm"
                            labelFormat="DD MMM YYYY"
                            utcTimestamp={pauseStatus.last_paused_on}
                          />
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm">
                      Your project data is safe but inaccessible while paused. Once resumed, usage
                      will be billed by compute size and hours active.
                    </p>
                  )
                ) : !isLoading ? (
                  <p className="text-sm">
                    All of your project's data is still intact, but your project is inaccessible
                    while paused.{' '}
                    {product !== undefined ? (
                      <>
                        Resume this project to access the{' '}
                        <span className="text-brand">{product}</span> page.
                      </>
                    ) : !isRestoreDisabled ? (
                      'Resume this project and get back to building!'
                    ) : null}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>

        {isError && (
          <AlertError
            className="rounded-none border-0"
            error={pauseStatusError}
            subject="Failed to retrieve pause status"
          />
        )}

        {isPauseStatusSuccess && !isRestoreDisabled && (
          <CardFooter className="flex justify-end items-center gap-x-2">
            {isFreePlan ? (
              <Button asChild type="default">
                <Link
                  href={`/org/${orgSlug}/billing?panel=subscriptionPlan&source=projectPausedStateRestore`}
                >
                  Upgrade to Pro
                </Link>
              </Button>
            ) : (
              <Button asChild type="default">
                <Link href={`/project/${ref}/settings/general`}>View project settings</Link>
              </Button>
            )}

            <ButtonTooltip
              size="tiny"
              type="primary"
              disabled={!canResumeProject}
              onClick={onSelectRestore}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canResumeProject
                    ? 'You need additional permissions to resume this project'
                    : undefined,
                },
              }}
            >
              Resume project
            </ButtonTooltip>
          </CardFooter>
        )}

        {isPauseStatusSuccess && isRestoreDisabled && <PauseDisabledState />}
      </Card>

      <ConfirmationModal
        visible={showConfirmRestore}
        size="small"
        title="Resume this project"
        onCancel={() => setShowConfirmRestore(false)}
        onConfirm={() => form.handleSubmit(onConfirmRestore)()}
        loading={isRestoring}
        confirmLabel="Resume"
        confirmLabelLoading="Resuming"
        cancelLabel="Cancel"
      >
        <div className={cn(showPostgresVersionSelector && 'flex flex-col gap-y-4')}>
          <p className="text-sm">
            {isFreePlan
              ? 'Your project’s data will be restored to when it was initially paused.'
              : 'Your project’s data will be restored and billing will resume based on compute size and hours active.'}
          </p>
          <Form_Shadcn_ {...form}>
            <form onSubmit={form.handleSubmit(onConfirmRestore)}>
              {showPostgresVersionSelector && (
                <div className="space-y-2">
                  <FormField_Shadcn_
                    control={form.control}
                    name="postgresVersionSelection"
                    render={({ field }) => (
                      <PostgresVersionSelector
                        field={field}
                        form={form}
                        type="unpause"
                        label="Postgres version"
                        layout="vertical"
                        dbRegion={region?.displayName ?? ''}
                        cloudProvider={(project?.cloud_provider ?? 'AWS') as CloudProvider}
                        organizationSlug={selectedOrganization?.slug}
                      />
                    )}
                  />
                </div>
              )}
            </form>
          </Form_Shadcn_>
        </div>
      </ConfirmationModal>

      <Dialog
        open={showFreeProjectLimitWarning}
        onOpenChange={() => setShowFreeProjectLimitWarning(false)}
      >
        <DialogContent size="medium" className="gap-0 pb-0">
          <DialogHeader className="border-b">
            <DialogTitle className="leading-normal">
              Your organization has members who have exceeded their free project limits
            </DialogTitle>
          </DialogHeader>
          <DialogSection className="text-sm">
            <p className="text-foreground-light">
              The following members have reached their maximum limits for the number of active free
              plan projects within organizations where they are an administrator or owner:
            </p>
            <ul className="my-4 list-disc list-inside">
              {(membersExceededLimit || []).map((member, idx: number) => (
                <li key={`member-${idx}`}>
                  {member.username || member.primary_email} (Limit: {member.free_project_limit} free
                  projects)
                </li>
              ))}
            </ul>
            <p className="text-foreground-light">
              These members will need to either delete, pause, or upgrade one or more of these
              projects before you're able to resume this project.
            </p>
          </DialogSection>
          <DialogFooter>
            <Button
              htmlType="button"
              type="default"
              onClick={() => setShowFreeProjectLimitWarning(false)}
            >
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
