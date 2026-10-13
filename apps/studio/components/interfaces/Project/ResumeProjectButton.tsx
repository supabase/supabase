import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useFlag, useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo, useRef, useState, type ComponentPropsWithoutRef } from 'react'
import { useForm } from 'react-hook-form'
import { AWS_REGIONS, CloudProvider } from 'shared-data'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Form,
  FormField,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { z } from 'zod'

import {
  extractPostgresVersionDetails,
  PostgresVersionSelector,
} from '@/components/interfaces/ProjectCreation/PostgresVersionSelector'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useFreeProjectLimitCheckQuery } from '@/data/organizations/free-project-limit-check-query'
import { useSetProjectStatus } from '@/data/projects/project-detail-query'
import { useProjectPauseStatusQuery } from '@/data/projects/project-pause-status-query'
import { useProjectRestoreMutation } from '@/data/projects/project-restore-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'

const FormSchema = z.object({
  postgresVersionSelection: z.string(),
})

type ResumeProjectButtonProps = Pick<
  ComponentPropsWithoutRef<typeof ButtonTooltip>,
  'className' | 'size' | 'variant'
> & {
  label?: string
}

export const ResumeProjectButton = ({
  className,
  label = 'Resume project',
  size,
  variant = 'default',
}: ResumeProjectButtonProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { setProjectStatus } = useSetProjectStatus()

  const newProjectInternalOnlyConfiguration = useFlag('newProjectInternalOnlyConfiguration')
  const region = Object.values(AWS_REGIONS).find((x) => x.code === project?.region)
  const orgSlug = selectedOrganization?.slug
  const isFreePlan = selectedOrganization?.plan?.id === 'free'

  const {
    data: pauseStatus,
    isPending: isPauseStatusPending,
    isSuccess: isPauseStatusSuccess,
  } = useProjectPauseStatusQuery({ ref }, { enabled: project?.status === PROJECT_STATUS.INACTIVE })

  const isRestoreDisabled = isPauseStatusSuccess && !pauseStatus.can_restore

  const { data: membersExceededLimit } = useFreeProjectLimitCheckQuery(
    { slug: orgSlug },
    { enabled: isFreePlan }
  )

  const hasMembersExceedingFreeTierLimit = (membersExceededLimit ?? []).length > 0

  const [showConfirmRestore, setShowConfirmRestore] = useState(false)
  const [showFreeProjectLimitWarning, setShowFreeProjectLimitWarning] = useState(false)
  const [billingBlockReason, setBillingBlockReason] = useState<string>()

  const { can: canResumeProject } = useAsyncCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_jobs.projects.initialize_or_resume'
  )

  const { mutate: restoreProject, isPending: isRestoring } = useProjectRestoreMutation({
    onSuccess: async (_, variables) => {
      setProjectStatus({ ref: variables.ref, status: PROJECT_STATUS.RESTORING })
      toast.success('Restoring project, project will be ready in a few minutes')
      await router.push(`/project/${variables.ref}`)
    },
    onError: (error) => {
      // 402s from restore (unpaid invoices, restrictions, Free Plan limits) are all resolved from billing
      if (error.code === 402) {
        setShowConfirmRestore(false)
        return setBillingBlockReason(error.message)
      }
      toast.error(`Failed to restore project: ${error.message}`)
    },
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: { postgresVersionSelection: '' },
  })
  const lastValidPostgresVersionSelection = useRef('')

  const onSelectRestore = () => {
    if (project?.status !== PROJECT_STATUS.INACTIVE) {
      return toast.error('Unable to resume: project is not paused')
    }

    if (isRestoreDisabled) {
      return toast.error('This project can no longer be resumed from the dashboard')
    }

    if (!canResumeProject) {
      return toast.error('You do not have the required permissions to restore this project')
    }

    if (hasMembersExceedingFreeTierLimit) {
      return setShowFreeProjectLimitWarning(true)
    }

    setShowConfirmRestore(true)
  }

  const onConfirmRestore = async (values: z.infer<typeof FormSchema>) => {
    if (!project) {
      return toast.error('Unable to restore: project is required')
    }

    if (!newProjectInternalOnlyConfiguration) {
      return restoreProject({ ref: project.ref })
    }

    const postgresVersionDetails = extractPostgresVersionDetails(values.postgresVersionSelection)

    restoreProject({
      ref: project.ref,
      releaseChannel: postgresVersionDetails.releaseChannel,
      postgresEngine: postgresVersionDetails.postgresEngine,
    })
  }

  const buttonDisabled =
    project?.status !== PROJECT_STATUS.INACTIVE ||
    project === undefined ||
    isPauseStatusPending ||
    isRestoring ||
    isRestoreDisabled ||
    !canResumeProject

  const tooltipText = useMemo(() => {
    if (isPauseStatusPending) return 'Checking whether this project can be resumed'
    if (project?.status !== PROJECT_STATUS.INACTIVE) {
      return 'Project must be paused before it can be resumed'
    }
    if (isRestoreDisabled) return 'This project can no longer be resumed from the dashboard'
    if (!canResumeProject) return 'You need additional permissions to resume this project'
    return undefined
  }, [canResumeProject, isPauseStatusPending, isRestoreDisabled, project?.status])

  return (
    <>
      <ButtonTooltip
        className={className}
        size={size}
        variant={variant}
        disabled={buttonDisabled}
        loading={isRestoring}
        onClick={onSelectRestore}
        tooltip={{
          content: {
            side: 'bottom',
            text: tooltipText,
          },
        }}
      >
        {label}
      </ButtonTooltip>

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
        <div className={cn(newProjectInternalOnlyConfiguration && 'flex flex-col gap-y-4')}>
          <p className="text-sm">
            {isFreePlan
              ? 'Your project’s data will be restored to when it was initially paused.'
              : 'Your project’s data will be restored and billing will resume based on compute size and hours active.'}
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onConfirmRestore)}>
              {newProjectInternalOnlyConfiguration && (
                <div className="space-y-2">
                  <FormField
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
                        lastValidSelectionRef={lastValidPostgresVersionSelection}
                      />
                    )}
                  />
                </div>
              )}
            </form>
          </Form>
        </div>
      </ConfirmationModal>

      <Dialog
        open={showFreeProjectLimitWarning}
        onOpenChange={() => setShowFreeProjectLimitWarning(false)}
      >
        <DialogContent size="medium" className="gap-0 pb-0" aria-describedby={undefined}>
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
              {(membersExceededLimit ?? []).map((member, idx: number) => (
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
            <Button type="button" onClick={() => setShowFreeProjectLimitWarning(false)}>
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!billingBlockReason} onOpenChange={() => setBillingBlockReason(undefined)}>
        <DialogContent size="small" aria-describedby={undefined} className="gap-0 pb-0">
          <DialogHeader className="border-b">
            <DialogTitle>Unable to resume project</DialogTitle>
          </DialogHeader>
          <DialogSection className="text-sm text-foreground-light">
            {billingBlockReason}
          </DialogSection>
          <DialogFooter>
            <Button variant="default" onClick={() => setBillingBlockReason(undefined)}>
              Cancel
            </Button>
            <Button asChild variant="primary">
              <Link href={`/org/${orgSlug}/billing`}>Go to billing</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
