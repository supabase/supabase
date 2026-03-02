import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useSetProjectStatus } from 'data/projects/project-detail-query'
import { useProjectPauseMutation } from 'data/projects/project-pause-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import {
  useIsAwsK8sCloudProvider,
  useIsProjectActive,
  useSelectedProjectQuery,
} from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { Pause } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

const PauseProjectButton = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { setProjectStatus } = useSetProjectStatus()

  const isProjectActive = useIsProjectActive()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const projectRef = project?.ref ?? ''
  const isPaused = project?.status === PROJECT_STATUS.INACTIVE
  const { can: canPauseProject } = useAsyncCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_jobs.projects.pause'
  )

  const isAwsK8s = useIsAwsK8sCloudProvider()
  const isFreePlan = organization?.plan.id === 'free'
  const isBranch = Boolean(project?.parent_project_ref)
  const isPaidAndNotAwsK8s = !isBranch && !isFreePlan && !isAwsK8s

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
    isPaidAndNotAwsK8s || project === undefined || isPaused || !canPauseProject || !isProjectActive

  return (
    <>
      <ButtonTooltip
        type="default"
        icon={<Pause />}
        onClick={() => setIsModalOpen(true)}
        loading={isPausing}
        disabled={buttonDisabled}
        tooltip={{
          content: {
            side: 'bottom',
            text: isPaused
              ? 'Your project is already paused'
              : !canPauseProject
                ? 'You need additional permissions to pause this project'
                : !isProjectActive
                  ? 'Unable to pause project as project is not active'
                  : isPaidAndNotAwsK8s
                    ? 'Projects on a paid plan will always be running'
                    : undefined,
          },
        }}
      >
        Pause project
      </ButtonTooltip>

      <ConfirmationModal
        variant={'destructive'}
        visible={isModalOpen}
        loading={isPausing}
        title="Pause this project?"
        confirmLabel="Pause project"
        confirmLabelLoading="Pausing project"
        onCancel={() => setIsModalOpen(false)}
        onConfirm={requestPauseProject}
      >
        <p className="text-foreground-light text-sm">
          Are you sure you want to pause this project? It will not be accessible until you unpause
          it.
        </p>
      </ConfirmationModal>
    </>
  )
}

export default PauseProjectButton
