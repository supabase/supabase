import { FC, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Alert, Button, IconPauseCircle } from '@supabase/ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { Project } from 'types'
import { checkPermissions, useStore, useSubscriptionStats, useFlag } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS, DEFAULT_FREE_PROJECTS_LIMIT } from 'lib/constants'
import { DeleteProjectButton } from 'components/interfaces/Settings/General'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'

interface Props {
  project: Project
}

const ProjectPausedState: FC<Props> = ({ project }) => {
  const { ui, app } = useStore()
  const subscriptionStats = useSubscriptionStats()
  const { total_active_free_projects: totalActiveFreeProjects } = subscriptionStats
  const freeProjectsLimit = ui.profile?.free_project_limit ?? DEFAULT_FREE_PROJECTS_LIMIT

  const enablePermissions = useFlag('enablePermissions')
  const isOwner = ui.selectedOrganization?.is_owner

  const [showConfirmRestore, setShowConfirmRestore] = useState(false)
  const hasExceedActiveFreeProjectsLimit = totalActiveFreeProjects >= freeProjectsLimit

  const canResumeProject = enablePermissions
    ? checkPermissions(PermissionAction.INFRA_EXECUTE, 'queue_jobs.projects.initialize_or_resume')
    : isOwner

  const onSelectRestore = () => {
    if (!canResumeProject) {
      return ui.setNotification({
        category: 'error',
        message: 'You do not have the required permissions to restore this project',
      })
    }
    setShowConfirmRestore(true)
  }

  const onConfirmRestore = async () => {
    await post(`${API_URL}/projects/${project.ref}/restore`, {})
    app.onProjectUpdated({ ...project, status: PROJECT_STATUS.RESTORING })
    ui.setNotification({ category: 'success', message: 'Restoring project' })
  }

  return (
    <>
      <div className="space-y-4">
        {hasExceedActiveFreeProjectsLimit && (
          <div className="mx-6">
            <Alert
              withIcon
              variant="warning"
              title={`Your account can only have ${freeProjectsLimit} active free projects`}
            >
              To restore this project you'll need to pause or delete an existing free project.
            </Alert>
          </div>
        )}
        <div className="mx-auto mb-16 w-full max-w-7xl">
          <div className="bg-scale-300 border-scale-400 mx-6 flex h-[500px] items-center justify-center rounded border p-8">
            <div className="grid w-[420px] gap-4">
              <div className="mx-auto flex max-w-[300px] items-center justify-center space-x-4 lg:space-x-8">
                <IconPauseCircle className="text-scale-1100" size={50} strokeWidth={1.5} />
              </div>

              <p className="text-center">This project is paused.</p>

              <div className="flex items-center justify-center gap-4">
                <Tooltip.Root delayDuration={0}>
                  <Tooltip.Trigger>
                    <Button
                      size="tiny"
                      type="primary"
                      disabled={hasExceedActiveFreeProjectsLimit || !canResumeProject}
                      onClick={onSelectRestore}
                    >
                      Restore project
                    </Button>
                  </Tooltip.Trigger>
                  {!canResumeProject && (
                    <Tooltip.Content side="bottom">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'bg-scale-100 rounded py-1 px-2 leading-none shadow', // background
                          'border-scale-200 border ', //border
                        ].join(' ')}
                      >
                        <span className="text-scale-1200 text-xs">
                          You need additional permissions to resume this project
                        </span>
                      </div>
                    </Tooltip.Content>
                  )}
                </Tooltip.Root>
                <DeleteProjectButton type="default" />
              </div>

              {!hasExceedActiveFreeProjectsLimit && (
                <p className="text-scale-1000 mt-4 text-sm">
                  Restore this project and get back to building the next big thing!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        visible={showConfirmRestore}
        title="Restore this project"
        description="Confirm to restore this project? Your project's data will be restored to when it was initially paused."
        buttonLabel="Restore project"
        buttonLoadingLabel="Restoring project"
        onSelectCancel={() => setShowConfirmRestore(false)}
        onSelectConfirm={onConfirmRestore}
      />
    </>
  )
}

export default ProjectPausedState
