import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { IS_PLATFORM } from '@/lib/constants'

interface WorkerLogsTabProps {
  projectRef: string
  workerName: string
}

/**
 * Reuses the Edge Functions Logs Explorer UI. Workers don't have a dedicated
 * log source in this prototype, so we point at the `functions` query type to
 * render the same explorer shell the demo audience already recognizes.
 */
export const WorkerLogsTab = ({ projectRef, workerName }: WorkerLogsTabProps) => {
  if (!IS_PLATFORM) {
    return (
      <div className="rounded-md border border-default bg-surface-100 px-6 py-10 text-center">
        <p className="text-sm text-foreground-light">
          Logs stream to Logflare on the hosted platform.
        </p>
        <p className="text-sm text-foreground-lighter">
          Run this project on Supabase to view worker logs here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <LogsPreviewer
        condensedLayout
        projectRef={projectRef}
        queryType="functions"
        filterOverride={{ 'metadata.worker_name': workerName }}
      />
    </div>
  )
}
