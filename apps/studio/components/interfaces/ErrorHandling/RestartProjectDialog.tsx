'use client'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { useSetProjectStatus } from '@/data/projects/project-detail-query'
import { useProjectRestartMutation } from '@/data/projects/project-restart-mutation'
import { useProjectRestartServicesMutation } from '@/data/projects/project-restart-services-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'

interface RestartProjectDialogProps {
  visible: boolean
  onClose: () => void
  /** Restart type: 'project' for full restart, 'database' for fast database reboot */
  restartType?: 'project' | 'database'
}

export function RestartProjectDialog({
  visible,
  onClose,
  restartType = 'database',
}: RestartProjectDialogProps) {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { setProjectStatus } = useSetProjectStatus()

  const { can: canRestartProject } = useAsyncCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'reboot'
  )

  const { mutate: restartProject, isPending: isRestartingProject } = useProjectRestartMutation({
    onSuccess: () => {
      if (project?.ref) {
        setProjectStatus({ ref: project.ref, status: PROJECT_STATUS.RESTARTING })
      }
      toast.success('Restarting project')
      router.push(`/project/${project?.ref}`)
      onClose()
    },
    onError: (error) => {
      toast.error(`Unable to restart project: ${error.message}`)
    },
  })

  const { mutate: restartProjectServices, isPending: isRestartingServices } =
    useProjectRestartServicesMutation({
      onSuccess: () => {
        if (project?.ref) {
          setProjectStatus({ ref: project.ref, status: PROJECT_STATUS.RESTARTING })
        }
        toast.success('Restarting database')
        router.push(`/project/${project?.ref}`)
        onClose()
      },
      onError: (error) => {
        toast.error(`Unable to restart database: ${error.message}`)
      },
    })

  const isLoading = isRestartingProject || isRestartingServices

  const handleRestart = () => {
    if (!project?.ref) return

    if (!canRestartProject) {
      return toast.error('You do not have the required permissions to restart this project')
    }

    if (restartType === 'project') {
      restartProject({ ref: project.ref })
    } else {
      restartProjectServices({
        ref: project.ref,
        region: project.region,
        services: ['postgresql'],
      })
    }
  }

  const title = restartType === 'project' ? 'Restart project' : 'Restart database'
  const description =
    restartType === 'project'
      ? 'Are you sure you want to restart your project? There will be a few minutes of downtime.'
      : 'Are you sure you want to restart your database? There will be a brief downtime.'

  return (
    <ConfirmationModal
      visible={visible}
      variant="warning"
      title={title}
      description={description}
      confirmLabel="Restart"
      confirmLabelLoading="Restarting"
      loading={isLoading}
      disabled={!canRestartProject}
      onCancel={onClose}
      onConfirm={handleRestart}
    />
  )
}
