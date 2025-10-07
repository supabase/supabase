import { ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'

import { CloneStatus } from 'data/projects/clone-status-query'
import { TimestampInfo } from 'ui-patterns'
import { StatusBadge } from './StatusBadge'

export const PreviousRestoreItem = ({ clone }: { clone: CloneStatus['clones'][number] }) => {
  if (clone.status === 'REMOVED') {
    return (
      <div className="grid grid-cols-4 gap-2 text-sm p-4 group">
        <div className="min-w-24 truncate">{clone.target_project?.name ?? 'Unknown project'}</div>
        <div>
          <StatusBadge status={clone.status} />
        </div>
        <div>
          <TimestampInfo
            className="font-mono text-xs text-foreground-lighter"
            utcTimestamp={clone.inserted_at ?? ''}
          />
        </div>
      </div>
    )
  } else {
    return (
      <Link
        href={`/project/${clone.target_project?.ref ?? '_'}`}
        className="grid grid-cols-4 gap-2 text-sm p-4 group"
      >
        <div className="min-w-24 truncate">{clone.target_project?.name ?? 'Unknown project'}</div>
        <div>
          <StatusBadge status={clone.status} />
        </div>
        <div>
          <TimestampInfo
            className="font-mono text-xs text-foreground-lighter"
            utcTimestamp={clone.inserted_at ?? ''}
          />
        </div>
        <div className="flex items-center justify-end text-foreground-lighter group-hover:text-foreground">
          <ChevronRightIcon className="w-4 h-4" />
        </div>
      </Link>
    )
  }
}
