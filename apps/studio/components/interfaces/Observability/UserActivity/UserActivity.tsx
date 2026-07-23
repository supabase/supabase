import { Smile } from 'lucide-react'
import { useState } from 'react'
import { Badge } from 'ui'

import { MOCK_EVENTS, MOCK_USER } from './UserActivity.constants'
import {
  UserActivityControls,
  type UserActivityFilter,
  type UserActivityView,
} from './UserActivityControls'
import { UserActivityTablePlaceholder } from './UserActivityTablePlaceholder'
import { UserActivityTimeline } from './UserActivityTimeline'

export const UserActivity = () => {
  const [view, setView] = useState<UserActivityView>('timeline')
  // NOTE: `filter` and the date chip are intentionally decorative for this prototype —
  // they hold state but do not yet filter the mocked events.
  const [filter, setFilter] = useState<UserActivityFilter>('all')
  const [dateLabel, setDateLabel] = useState<string | null>('May 14, 2026')

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-3">
        <div className="flex items-center gap-x-2">
          <h1 className="text-xl text-foreground">User Activity</h1>
          <Badge variant="warning">Beta</Badge>
        </div>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-200 text-foreground-light">
              <Smile size={18} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-foreground">{MOCK_USER.email}</span>
              <span className="font-mono text-xs text-foreground-lighter">{MOCK_USER.id}</span>
            </div>
          </div>

          <UserActivityControls
            view={view}
            onViewChange={setView}
            filter={filter}
            onFilterChange={setFilter}
            dateLabel={dateLabel}
            onClearDate={() => setDateLabel(null)}
          />
        </div>
      </div>

      {view === 'timeline' ? (
        <UserActivityTimeline events={MOCK_EVENTS} />
      ) : (
        <UserActivityTablePlaceholder />
      )}
    </div>
  )
}
