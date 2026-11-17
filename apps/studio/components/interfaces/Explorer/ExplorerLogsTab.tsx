import { useLocation } from '@tanstack/react-router'
import { useParams } from 'common'
import { DownloadIcon, RefreshCwIcon, Settings2Icon } from 'lucide-react'
import { useEffect, useEffectEvent } from 'react'
import { cn } from 'ui'

import { ExplorerQueryViewport } from './ExplorerQuery'
import { ExplorerToolbar, ExplorerToolbarAction, ExplorerToolbarActions } from './ExplorerToolbar'
import { DownloadLogsButton } from '@/components/interfaces/UnifiedLogs/components/DownloadLogsButton'
import { UnifiedLogs } from '@/components/interfaces/UnifiedLogs/UnifiedLogs'
import { SEARCH_PARAMS_PARSER } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import type { UnifiedLogsToolbarSlots } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { DataTableViewOptions } from '@/components/ui/DataTable/DataTableViewOptions'
import { LiveButton } from '@/components/ui/DataTable/LiveButton'
import { EXPLORER_LOGS_TAB_ID, useTabsStateSnapshot } from '@/state/tabs'

/** The Logs page's filter bar and actions, laid out like the other Explorer tabs' toolbars. */
const ExplorerLogsToolbar = ({
  filterBar,
  isRefreshing,
  onRefresh,
  searchParameters,
  fetchPreviousPage,
}: UnifiedLogsToolbarSlots) => (
  // The filter bar pads its own search icon, so the toolbar's left padding is trimmed to line
  // the icon up with other toolbars' 16px inset, as on a table tab.
  <ExplorerToolbar aria-label="Logs toolbar" className="pl-0.5 pr-4">
    <div className="min-w-0 flex-1">{filterBar}</div>
    <ExplorerToolbarActions className="gap-x-1">
      <ExplorerToolbarAction
        icon={
          <RefreshCwIcon size={16} strokeWidth={2} className={cn(isRefreshing && 'animate-spin')} />
        }
        aria-label="Refresh"
        tooltip="Refresh"
        disabled={isRefreshing}
        onClick={onRefresh}
      />
      <DataTableViewOptions
        trigger={
          <ExplorerToolbarAction
            icon={<Settings2Icon size={16} strokeWidth={2} />}
            aria-label="Columns"
            tooltip="Toggle column visibility"
          />
        }
      />
      {/* The download menu brings its own shortcut tooltip. */}
      <DownloadLogsButton
        searchParameters={searchParameters}
        trigger={
          <ExplorerToolbarAction
            icon={<DownloadIcon size={16} strokeWidth={2} />}
            aria-label="Download logs"
          />
        }
      />
      {fetchPreviousPage && (
        <div className="ml-2">
          <LiveButton
            fetchPreviousPage={fetchPreviousPage}
            searchParamsParser={SEARCH_PARAMS_PARSER}
          />
        </div>
      )}
    </ExplorerToolbarActions>
  </ExplorerToolbar>
)

/**
 * The project's logs as an Explorer tab: the Logs page's table, chart and filter bar, without its
 * filter sidebar. The sidebar's views set the filters, which live in the URL, so the tab keeps
 * whatever filters it was left with when someone switches away and back.
 */
export const ExplorerLogsTab = () => {
  const { ref } = useParams()
  const tabs = useTabsStateSnapshot()
  const searchStr = useLocation({ select: (location) => location.searchStr })

  const registerTab = useEffectEvent(() => {
    tabs.addTab({
      id: EXPLORER_LOGS_TAB_ID,
      type: 'logs',
      label: 'Logs',
      metadata: { logsSearch: searchStr },
      isPreview: false,
    })
  })
  useEffect(() => registerTab(), [ref])

  const rememberSearch = useEffectEvent(() =>
    tabs.updateTab(EXPLORER_LOGS_TAB_ID, { logsSearch: searchStr })
  )
  useEffect(() => rememberSearch(), [searchStr])

  return (
    <ExplorerQueryViewport>
      <UnifiedLogs
        hasFilterSideBar={false}
        columnPreferencesKey="explorer-logs"
        renderToolbar={(slots) => <ExplorerLogsToolbar {...slots} />}
      />
    </ExplorerQueryViewport>
  )
}
