import { useParams } from 'common'
import { Loader2 } from 'lucide-react'

import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { PROJECT_STATUS } from 'lib/constants'

const RestartingState = () => {
  const { ref } = useParams()
  useProjectDetailQuery(
    { ref },
    {
      // setting a refetch interval here will cause the `useSelectedProject()` in `ProjectLayout.tsx` to
      // rerender every 4 seconds while the project is restarting. Once restarting is complete, it will
      // no longer show this state.
      refetchInterval(data) {
        return data?.status !== PROJECT_STATUS.ACTIVE_HEALTHY ? 4000 : false
      },
    }
  )

  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-surface-100 border border-overlay rounded-md w-3/4 lg:w-1/2">
        <div className="space-y-6 py-6">
          <div className="flex px-8 space-x-8">
            <div className="mt-1">
              <Loader2 className="animate-spin" size={18} />
            </div>
            <div className="space-y-1">
              <p>Restarting...</p>
              <p className="text-sm text-foreground-light">
                Restarting can take a few minutes. Your project will be offline while it restarts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RestartingState
