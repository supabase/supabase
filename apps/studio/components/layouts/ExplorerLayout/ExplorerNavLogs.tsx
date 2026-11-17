import { useLocation, useNavigate } from '@tanstack/react-router'
import { useParams } from 'common'
import { CircleAlertIcon } from 'lucide-react'
import { useQueryState } from 'nuqs'

import { EXPLORER_LOGS_SECTION, ExplorerNavPanel, rowClassName } from './ExplorerLayout.constants'
import {
  EXPLORER_LOGS_VIEWS,
  getLogsViewHref,
  isLogsViewApplied,
  type ExplorerLogsView,
} from '@/components/interfaces/Explorer/ExplorerLogsTab.utils'
import { LogTypeIcon } from '@/components/interfaces/UnifiedLogs/components/LogTypeIcon'
import { SEARCH_PARAMS_PARSER } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import { BASE_PATH } from '@/lib/constants'

const ViewIcon = ({ view }: { view: ExplorerLogsView }) => {
  if (view.iconLogType !== undefined) {
    return <LogTypeIcon type={view.iconLogType} size={14} className="shrink-0" />
  }
  if (view.id === 'errors') return <CircleAlertIcon size={14} className="shrink-0" />
  return <EXPLORER_LOGS_SECTION.icon size={14} className="shrink-0" />
}

/**
 * Views over the project's logs. Each opens the Logs tab with its filters in the filter bar,
 * replacing whatever was there; changing them leaves no view selected.
 */
export const ExplorerNavLogs = () => {
  const { ref } = useParams()
  const pathname = useLocation({ select: (location) => location.pathname })
  const navigate = useNavigate()
  const [urlFilters] = useQueryState('filter', SEARCH_PARAMS_PARSER.filter)
  const isLogsTabOpen = pathname.endsWith('/explorer/logs')

  return (
    <ExplorerNavPanel label={EXPLORER_LOGS_SECTION.label}>
      <nav
        aria-label="Log views"
        className="flex flex-1 min-h-0 flex-col gap-px overflow-y-auto p-3"
      >
        {EXPLORER_LOGS_VIEWS.map((view) => {
          const isActive = isLogsTabOpen && isLogsViewApplied(view, urlFilters)
          const href = getLogsViewHref(ref ?? '', view)

          return (
            <a
              key={view.id}
              href={`${BASE_PATH}${href}`}
              aria-current={isActive ? 'page' : undefined}
              className={rowClassName(isActive)}
              onClick={(event) => {
                // Keep modified clicks (new tab, new window) as ordinary links.
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
                event.preventDefault()
                navigate({ href })
              }}
            >
              <ViewIcon view={view} />
              <span className="flex-1 truncate text-left">{view.name}</span>
            </a>
          )
        })}
      </nav>
    </ExplorerNavPanel>
  )
}
