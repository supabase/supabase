import { proxy, snapshot, useSnapshot } from 'valtio'

import { SIDEBAR_KEYS, sidebarManagerState } from './sidebar-manager-state'

export type AdvisorCenterTab = 'all' | 'security' | 'performance' | 'messages'
export type AdvisorSeverity = 'critical' | 'warning' | 'info'

const initialState = {
  activeTab: 'all' as AdvisorCenterTab,
  severityFilters: ['critical'] as AdvisorSeverity[],
  selectedItemId: undefined as string | undefined,
}

export const advisorCenterState = proxy({
  ...initialState,
  setActiveTab(tab: AdvisorCenterTab) {
    advisorCenterState.activeTab = tab
  },
  toggleSeverityFilter(severity: AdvisorSeverity) {
    advisorCenterState.severityFilters = advisorCenterState.severityFilters.includes(severity)
      ? advisorCenterState.severityFilters.filter((item) => item !== severity)
      : advisorCenterState.severityFilters.concat(severity)
  },
  setSeverityFilters(severities: AdvisorSeverity[]) {
    advisorCenterState.severityFilters = severities
  },
  clearSeverityFilters() {
    advisorCenterState.severityFilters = []
  },
  selectItem(id: string | undefined) {
    advisorCenterState.selectedItemId = id
  },
  focusItem({ id, tab }: { id: string; tab?: AdvisorCenterTab }) {
    sidebarManagerState.openSidebar(SIDEBAR_KEYS.ADVISOR_CENTER)
    if (tab) {
      advisorCenterState.activeTab = tab
    }
    advisorCenterState.selectedItemId = id
  },
  reset() {
    sidebarManagerState.closeSidebar(SIDEBAR_KEYS.ADVISOR_CENTER)
    Object.assign(advisorCenterState, initialState)
  },
})

export const getAdvisorCenterStateSnapshot = () => snapshot(advisorCenterState)

export const useAdvisorCenterStateSnapshot = (
  options?: Parameters<typeof useSnapshot>[1]
) => useSnapshot(advisorCenterState, options)
