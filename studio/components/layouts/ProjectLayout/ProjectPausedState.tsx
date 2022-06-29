import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { Button, IconAlertCircle, IconPauseCircle } from '@supabase/ui'

import { Project } from 'types'
import { useStore, useSubscriptionStats } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS, DEFAULT_FREE_PROJECTS_LIMIT } from 'lib/constants'
import { DeleteProjectButton } from 'components/interfaces/Settings/General'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'

interface Props {
  project: Project
}

const ProjectPausedState: FC<Props> = ({ project }) => {
  const router = useRouter()
  const { ui, app } = useStore()
  const subscriptionStats = useSubscriptionStats()
  const {
    total_free_projects: totalFreeProjects,
    total_active_free_projects: totalActiveFreeProjects,
    total_paused_free_projects: totalPausedFreeProjects,
  } = subscriptionStats
  const freeProjectsLimit = ui.profile?.free_project_limit ?? DEFAULT_FREE_PROJECTS_LIMIT

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmRestore, setShowConfirmRestore] = useState(false)

  const onConfirmRestore = async () => {
    await post(`${API_URL}/projects/${project.ref}/restore`, {})
    app.onProjectUpdated({ ...project, status: PROJECT_STATUS.RESTORING })
    ui.setNotification({ category: 'success', message: 'Restoring project' })
  }

  return (
    <>
      <div className="mx-auto mt-8 mb-16 w-full max-w-7xl">
        <div className="bg-scale-300 border-scale-400 mx-6 flex h-[500px] items-center justify-center rounded border p-8">
          <div className="grid w-[420px] gap-4">
            <div className="mx-auto flex max-w-[300px] items-center justify-center space-x-4 lg:space-x-8">
              <IconPauseCircle className="text-scale-1100" size={50} strokeWidth={1.5} />
            </div>

            <p className="text-center">This project is paused.</p>

            <div className="flex items-center justify-center gap-4">
              <Button
                size="tiny"
                type="primary"
                loading={isSubmitting}
                onClick={() => setShowConfirmRestore(true)}
              >
                Restore project
              </Button>

              <DeleteProjectButton project={project} type="default" />
            </div>

            {totalActiveFreeProjects > totalFreeProjects ? (
              <div className="mt-4 flex gap-4 border-t pt-8">
                <IconAlertCircle className="text-red-900" size={35} strokeWidth={2} />
                <div>
                  <p className="text-md">
                    Your account can only have <u>{freeProjectsLimit} free projects.</u>
                  </p>
                  <p className="text-scale-900 mt-2 text-sm">
                    To restore this project you'll need to pause or delete an existing free project.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-scale-900 mt-4 text-sm">
                Restore this project and get back to building the next big thing!
              </p>
            )}
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
