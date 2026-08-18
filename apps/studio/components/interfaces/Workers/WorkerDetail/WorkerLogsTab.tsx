import { WorkerCommandLine } from '../WorkerCommandLine'
import { CLI_NAME } from '@/lib/constants/workers'

interface WorkerLogsTabProps {
  workerName: string
}

export const WorkerLogsTab = ({ workerName }: WorkerLogsTabProps) => (
  <div className="flex-1 rounded-md border border-default bg-surface-100 px-6 py-10">
    <div className="mx-auto max-w-md space-y-3 text-center">
      <p className="text-sm text-foreground">Worker logs are not in the dashboard yet</p>
      <p className="text-sm text-foreground-lighter">
        Stream them from the Supabase CLI until the logs endpoint ships.
      </p>
      <div className="pt-1 text-left">
        <WorkerCommandLine command={`supabase ${CLI_NAME} logs ${workerName} --follow`} />
      </div>
    </div>
  </div>
)
