import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ExternalLink, PauseCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import {
  PostgresEngine,
  ProjectUnpausePostgresVersion,
  ReleaseChannel,
  useProjectUnpausePostgresVersionsQuery,
} from 'data/config/project-unpause-postgres-versions-query'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useProjectPauseStatusQuery } from 'data/projects/project-pause-status-query'
import { useProjectRestoreMutation } from 'data/projects/project-restore-mutation'
import { setProjectStatus } from 'data/projects/projects-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useFlag } from 'hooks/ui/useFlag'
import { PROJECT_STATUS } from 'lib/constants'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Badge,
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Modal,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { PauseDisabledState } from './PauseDisabledState'
import { RestorePaidPlanProjectNotice } from '../RestorePaidPlanProjectNotice'
import { useProjectContext } from '../ProjectContext'

export interface ProjectPausedStateProps {
  product?: string
}

interface PostgresVersionDetails {
  postgresEngine: PostgresEngine
  releaseChannel: ReleaseChannel
}

const formatValue = ({ postgres_engine, release_channel }: ProjectUnpausePostgresVersion) => {
  return `${postgres_engine}|${release_channel}`
}

export const extractPostgresVersionDetails = (value: string): PostgresVersionDetails => {
  const [postgresEngine, releaseChannel] = value.split('|')
  return { postgresEngine, releaseChannel } as PostgresVersionDetails
}

export const ProjectPausedState = ({ product }: ProjectPausedStateProps) => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const { project } = useProjectContext()
  const selectedOrganization = useSelectedOrganization()
  const enforceNinetyDayUnpauseExpiry = useFlag('enforceNinetyDayUnpauseExpiry')
  const projectVersionSelectionDisabled = useFlag('disableProjectVersionSelection')

  const orgSlug = selectedOrganization?.slug
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug })
  const {
    data: pauseStatus,
    error: pauseStatusError,
    isError,
    isSuccess,
    isLoading,
  } = useProjectPauseStatusQuery(
    { ref },
    {
      enabled: project?.status === PROJECT_STATUS.INACTIVE && enforceNinetyDayUnpauseExpiry,
    }
  )

  const finalDaysRemainingBeforeRestoreDisabled =
    pauseStatus?.remaining_days_till_restore_disabled ??
    pauseStatus?.max_days_till_restore_disabled ??
    0

  const isFreePlan = subscription?.plan?.id === 'free'
  const isRestoreDisabled = enforceNinetyDayUnpauseExpiry && isSuccess && !pauseStatus.can_restore

  const { data: membersExceededLimit } = useFreeProjectLimitCheckQuery(
    { slug: orgSlug },
    { enabled: isFreePlan }
  )

  const { data: availablePostgresVersions } = useProjectUnpausePostgresVersionsQuery({
    projectRef: project?.ref,
  })
  const availableVersions = availablePostgresVersions?.available_versions || []

  const hasMembersExceedingFreeTierLimit = (membersExceededLimit || []).length > 0
  const [showConfirmRestore, setShowConfirmRestore] = useState(false)
  const [showFreeProjectLimitWarning, setShowFreeProjectLimitWarning] = useState(false)

  const { mutate: restoreProject, isLoading: isRestoring } = useProjectRestoreMutation({
    onSuccess: (_, variables) => {
      setProjectStatus(queryClient, variables.ref, PROJECT_STATUS.RESTORING)
      toast.success('Restoring project')
    },
  })

  const canResumeProject = useCheckPermissions(
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

    if (projectVersionSelectionDisabled) {
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
    defaultValues: {
      postgresVersionSelection: '',
    },
  })

  useEffect(() => {
    const defaultValue = availablePostgresVersions?.available_versions[0]
      ? formatValue(availablePostgresVersions?.available_versions[0])
      : ''
    form.setValue('postgresVersionSelection', defaultValue)
  }, [availablePostgresVersions, form])

  return (
    <>
      <div className="space-y-4">
        <div className="w-full mx-auto mb-16 max-w-7xl">
          <div className="mx-6 flex h-[500px] items-center justify-center rounded border border-overlay bg-surface-100 p-8">
            <div className="grid w-[550px] gap-4">
              <div className="mx-auto flex max-w-[300px] items-center justify-center space-x-4 lg:space-x-8">
                <PauseCircle className="text-foreground-light" size={50} strokeWidth={1.5} />
              </div>

              <div className="flex flex-col gap-y-2">
                <div className="flex flex-col gap-y-1">
                  <p className="text-center">
                    The project "{project?.name ?? ''}" is currently paused.
                  </p>
                  <p className="text-sm text-foreground-light text-center">
                    All of your project's data is still intact, but your project is inaccessible
                    while paused.{' '}
                    {product !== undefined ? (
                      <>
                        Restore this project to access the{' '}
                        <span className="text-brand">{product}</span> page
                      </>
                    ) : (
                      'Restore this project and get back to building!'
                    )}
                  </p>
                </div>

                {enforceNinetyDayUnpauseExpiry && (
                  <>
                    {isLoading && <GenericSkeletonLoader />}
                    {isError && (
                      <AlertError
                        error={pauseStatusError}
                        subject="Failed to retrieve pause status"
                      />
                    )}
                    {isSuccess && (
                      <>
                        {isRestoreDisabled ? (
                          <PauseDisabledState />
                        ) : isFreePlan ? (
                          <>
                            <p className="text-sm text-foreground-light text-center">
                              To prevent future pauses, consider upgrading to Pro.
                            </p>
                            <Alert_Shadcn_>
                              <AlertTitle_Shadcn_>
                                Project can be restored through the dashboard within the next{' '}
                                {finalDaysRemainingBeforeRestoreDisabled} day
                                {finalDaysRemainingBeforeRestoreDisabled > 1 ? 's' : ''}
                              </AlertTitle_Shadcn_>
                              <AlertDescription_Shadcn_>
                                Free projects cannot be restored through the dashboard if they are
                                paused for more than{' '}
                                <span className="text-foreground">
                                  {pauseStatus?.max_days_till_restore_disabled} days
                                </span>
                                . The latest that your project can be restored is by{' '}
                                <span className="text-foreground">
                                  {dayjs()
                                    .utc()
                                    .add(
                                      pauseStatus.remaining_days_till_restore_disabled ?? 0,
                                      'day'
                                    )
                                    .format('DD MMM YYYY')}
                                </span>
                                . However, your database backup and Storage objects will still be
                                available for download thereafter.
                              </AlertDescription_Shadcn_>
                              <AlertDescription_Shadcn_ className="mt-3">
                                <Button asChild type="default" icon={<ExternalLink />}>
                                  <a
                                    target="_blank"
                                    rel="noreferrer"
                                    href="https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects#time-limits"
                                  >
                                    More information
                                  </a>
                                </Button>
                              </AlertDescription_Shadcn_>
                            </Alert_Shadcn_>
                          </>
                        ) : (
                          <RestorePaidPlanProjectNotice />
                        )}
                      </>
                    )}
                  </>
                )}

                {!enforceNinetyDayUnpauseExpiry && !isFreePlan && <RestorePaidPlanProjectNotice />}
              </div>

              {(!enforceNinetyDayUnpauseExpiry || (isSuccess && !isRestoreDisabled)) && (
                <div className="flex items-center justify-center gap-4">
                  <ButtonTooltip
                    size="tiny"
                    type="default"
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
                    Restore project
                  </ButtonTooltip>
                  {isFreePlan ? (
                    <Button asChild type="primary">
                      <Link href={`/org/${orgSlug}/billing?panel=subscriptionPlan`}>
                        Upgrade to Pro
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild type="default">
                      <Link href={`/project/${ref}/settings/general`}>View project settings</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        hideFooter
        visible={showConfirmRestore}
        size={'small'}
        title="Restore this project"
        description="Confirm to restore this project? Your project's data will be restored to when it was initially paused."
        onCancel={() => setShowConfirmRestore(false)}
        header={'Restore this project'}
      >
        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onConfirmRestore)}>
            {!projectVersionSelectionDisabled && (
              <Modal.Content>
                <div className="space-y-2">
                  <FormField_Shadcn_
                    control={form.control}
                    name="postgresVersionSelection"
                    render={({ field }) => (
                      <FormItemLayout label="Select the version of Postgres to restore to">
                        <FormControl_Shadcn_>
                          <Select_Shadcn_
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={availableVersions.length <= 1}
                          >
                            <SelectTrigger_Shadcn_ className="[&>:nth-child(1)]:w-full [&>:nth-child(1)]:flex [&>:nth-child(1)]:items-start">
                              <SelectValue_Shadcn_ placeholder="Select a Postgres version" />
                            </SelectTrigger_Shadcn_>
                            <SelectContent_Shadcn_>
                              <SelectGroup_Shadcn_>
                                {availableVersions.map((value) => {
                                  const postgresVersion = value.version
                                    .split('supabase-postgres-')[1]
                                    ?.replace('-orioledb', '')
                                  return (
                                    <SelectItem_Shadcn_
                                      key={formatValue(value)}
                                      value={formatValue(value)}
                                      className="w-full [&>:nth-child(2)]:w-full"
                                    >
                                      <div className="flex flex-row items-center justify-between w-full">
                                        <span className="text-foreground">{postgresVersion}</span>
                                        <div>
                                          {value.release_channel !== 'ga' && (
                                            <Badge variant="warning" className="mr-1 capitalize">
                                              {value.release_channel}
                                            </Badge>
                                          )}
                                          {value.postgres_engine.includes('oriole-preview') && (
                                            <span>
                                              <Badge variant="warning" className="mr-1">
                                                OrioleDB
                                              </Badge>
                                              <Badge variant="warning" className="mr-1">
                                                Preview
                                              </Badge>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </SelectItem_Shadcn_>
                                  )
                                })}
                              </SelectGroup_Shadcn_>
                            </SelectContent_Shadcn_>
                          </Select_Shadcn_>
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </div>
              </Modal.Content>
            )}
            <Modal.Content className="flex items-center space-x-2 justify-end">
              <Button
                type="default"
                disabled={isRestoring}
                onClick={() => setShowConfirmRestore(false)}
              >
                Cancel
              </Button>
              <Button htmlType="submit" loading={isRestoring}>
                Confirm restore
              </Button>
            </Modal.Content>
          </form>
        </Form_Shadcn_>
      </Modal>

      <Modal
        hideFooter
        visible={showFreeProjectLimitWarning}
        size="medium"
        header="Your organization has members who have exceeded their free project limits"
        onCancel={() => setShowFreeProjectLimitWarning(false)}
      >
        <Modal.Content className="space-y-2">
          <p className="text-sm text-foreground-light">
            The following members have reached their maximum limits for the number of active free
            plan projects within organizations where they are an administrator or owner:
          </p>
          <ul className="pl-5 text-sm list-disc text-foreground-light">
            {(membersExceededLimit || []).map((member, idx: number) => (
              <li key={`member-${idx}`}>
                {member.username || member.primary_email} (Limit: {member.free_project_limit} free
                projects)
              </li>
            ))}
          </ul>
          <p className="text-sm text-foreground-light">
            These members will need to either delete, pause, or upgrade one or more of these
            projects before you're able to unpause this project.
          </p>
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content>
          <Button
            htmlType="button"
            type="default"
            onClick={() => setShowFreeProjectLimitWarning(false)}
            block
          >
            Understood
          </Button>
        </Modal.Content>
      </Modal>
    </>
  )
}
