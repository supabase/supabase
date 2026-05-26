import { PermissionAction } from '@supabase/shared-types/out/constants'
import { CirclePause } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useSetProjectStatus } from '@/data/projects/project-detail-query'
import { useProjectPauseMutation } from '@/data/projects/project-pause-mutation'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useIsProjectActive, useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'

const PauseProjectButton = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { setProjectStatus } = useSetProjectStatus()

  const isProjectActive = useIsProjectActive()
  const isProjectUnhealthy = project?.status === PROJECT_STATUS.ACTIVE_UNHEALTHY
  const [isModalOpen, setIsModalOpen] = useState(false)

  const projectRef = project?.ref ?? ''
  const isPaused = project?.status === PROJECT_STATUS.INACTIVE
  const { can: canPauseProject } = useAsyncCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_jobs.projects.pause'
  )

  const isFreePlan = organization?.plan.id === 'free'
  const isBranch = Boolean(project?.parent_project_ref)
  const { hasAccess: projectPausingAllowedInOrg } = useCheckEntitlements(
    'project_pausing',
    organization?.slug
  )

  const { mutate: pauseProject, isPending: isPausing } = useProjectPauseMutation({
    onSuccess: (_, variables) => {
      setProjectStatus({ ref: variables.ref, status: PROJECT_STATUS.PAUSING })
      toast.success('Pausing project...')
      router.push(`/project/${projectRef}`)
    },
  })

  const requestPauseProject = () => {
    if (!canPauseProject) {
      return toast.error('You do not have the required permissions to pause this project')
    }
    pauseProject({ ref: projectRef })
  }

  const buttonDisabled =
    isBranch ||
    !projectPausingAllowedInOrg ||
    project === undefined ||
    isPaused ||
    !canPauseProject ||
    !isProjectActive

  function getTooltipText() {
    if (isPaused) return 'Your project is already paused'
    if (!canPauseProject) return 'You need additional permissions to pause this project'
    if (isProjectUnhealthy)
      return 'Your project is unhealthy — restart it instead to restore normal operation'
    if (!isProjectActive) return 'Unable to pause project as project is not active'
    if (isBranch) return 'Branch projects cannot be paused'
    if (!projectPausingAllowedInOrg && !isFreePlan)
      return 'Projects on a paid plan will always be running'
    return undefined
  }

  return (
    <>
      <ButtonTooltip
        type="default"
        icon={<CirclePause />}
        onClick={() => setIsModalOpen(true)}
        loading={isPausing}
        disabled={buttonDisabled}
        tooltip={{
          content: {
            side: 'bottom',
            text: getTooltipText(),
          },
        }}
      >
        Pause project
      </ButtonTooltip>

      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause project?</AlertDialogTitle>
            <AlertDialogDescription>
              This project will be unavailable while paused. Paused projects can be resumed for 90
              days. After that, backups remain available to download.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPausing}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isPausing} onClick={requestPauseProject} variant="danger">
              {isPausing ? 'Pausing project...' : 'Pause project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default PauseProjectButton
