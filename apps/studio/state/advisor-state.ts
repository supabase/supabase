import { proxy, snapshot, useSnapshot } from 'valtio'

export type AdvisorTab = 'all' | 'security' | 'performance' | 'messages'
export type AdvisorSeverity = 'critical' | 'warning' | 'info'

const initialState = {
  activeTab: 'all' as AdvisorTab,
  severityFilters: ['critical'] as AdvisorSeverity[],
  selectedItemId: undefined as string | undefined,
}

export const advisorState = proxy({
  ...initialState,
  setActiveTab(tab: AdvisorTab) {
    advisorState.activeTab = tab
  },
  setSeverityFilters(severities: AdvisorSeverity[]) {
    advisorState.severityFilters = severities
  },
  clearSeverityFilters() {
    advisorState.severityFilters = []
  },
  setSelectedItemId(id: string | undefined) {
    advisorState.selectedItemId = id
  },
  focusItem({ id, tab }: { id: string; tab?: AdvisorTab }) {
    if (tab) {
      advisorState.activeTab = tab
    }
    advisorState.selectedItemId = id
  },
  reset() {
    Object.assign(advisorState, initialState)
  },
})

export const getAdvisorStateSnapshot = () => snapshot(advisorState)

export const useAdvisorStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(advisorState, options)
