import { formatDistanceToNow } from 'date-fns'
import CopyButton from 'components/ui/CopyButton'
import type { PrivateApp } from '../../PrivateAppsContext'

interface AppInformationProps {
  app: PrivateApp
}

export function AppInformation({ app }: AppInformationProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">App Information</h3>
      <div className="border border-default rounded-lg divide-y divide-default">
        <div className="flex items-center justify-between px-4 py-3 gap-4">
          <span className="text-sm text-foreground-light w-32 shrink-0">Name</span>
          <span className="text-sm font-medium flex-1">{app.name}</span>
        </div>
        <div className="flex items-start justify-between px-4 py-3 gap-4">
          <span className="text-sm text-foreground-light w-32 shrink-0 pt-0.5">Description</span>
          <span className="text-sm flex-1 text-foreground-light">
            {app.description || (
              <span className="italic text-foreground-muted">No description</span>
            )}
          </span>
        </div>
        <div className="flex items-center px-4 py-3 gap-4">
          <span className="text-sm text-foreground-light w-32 shrink-0">App ID</span>
          <div className="flex items-center gap-2 flex-1">
            <span className="font-mono text-sm">{app.id}</span>
            <CopyButton type="default" iconOnly text={app.id} className="px-1" />
          </div>
        </div>
        <div className="flex items-center px-4 py-3 gap-4">
          <span className="text-sm text-foreground-light w-32 shrink-0">Created</span>
          <span className="text-sm">
            {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  )
}
