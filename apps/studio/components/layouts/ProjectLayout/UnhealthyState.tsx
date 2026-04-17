import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { useProjectDetailQuery, useSetProjectStatus } from '@/data/projects/project-detail-query'
import { useProjectRestartMutation } from '@/data/projects/project-restart-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'

export const UnhealthyState = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { setProjectStatus } = useSetProjectStatus()
  const [showConfirm, setShowConfirm] = useState(false)

  const { can: canRestartProject } = useAsyncCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'reboot'
  )

  useProjectDetailQuery(
    { ref },
    {
      // Poll until the project recovers, which will dismiss this guard automatically
      refetchInterval: (query) => {
        const data = query.state.data
        return data?.status === PROJECT_STATUS.ACTIVE_UNHEALTHY ? 4000 : false
      },
    }
  )

  const { mutate: restartProject, isPending: isRestarting } = useProjectRestartMutation({
    onSuccess: () => {
      setProjectStatus({ ref: project?.ref ?? '', status: PROJECT_STATUS.RESTARTING })
      toast.success('Restarting project...')
      router.push(`/project/${ref}`)
    },
    onError: (error) => {
      toast.error(`Failed to restart project: ${error.message}`)
    },
  })

  return (
    <>
      <div className="flex items-center justify-center h-full">
        <div className="bg-surface-100 border border-overlay rounded-md w-3/4 lg:w-1/2">
          <div className="space-y-6 py-6">
            <div className="flex px-8 space-x-8">
              <div className="mt-1">
                <AlertTriangle className="text-warning" size={18} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-3">
                <div className="space-y-1">
                  <p>Project {project?.name} is unhealthy</p>
                  <p className="text-sm text-foreground-light">
                    Your project is experiencing health issues and is not fully operational.
                    Restarting the project will attempt to restore normal operation.
                  </p>
                </div>
                <div>
                  <Button
                    type="default"
                    size="tiny"
                    disabled={!canRestartProject}
                    loading={isRestarting}
                    onClick={() => setShowConfirm(true)}
                  >
                    Restart project
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        visible={showConfirm}
        variant="destructive"
        title="Restart project"
        description="Are you sure you want to restart your project? There will be a few minutes of downtime."
        confirmLabel="Restart"
        confirmLabelLoading="Restarting"
        loading={isRestarting}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => restartProject({ ref: ref ?? '' })}
      />
    </>
  )
}
