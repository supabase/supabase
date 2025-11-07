import { proxy, snapshot, useSnapshot } from 'valtio'

export type AdvisorTab = 'all' | 'security' | 'performance' | 'messages'
export type AdvisorSeverity = 'critical' | 'warning' | 'info'
export type AdvisorItemSource = 'lint' | 'notification'

const initialState = {
  activeTab: 'all' as AdvisorTab,
  severityFilters: ['critical'] as AdvisorSeverity[],
  selectedItemId: undefined as string | undefined,
  selectedItemSource: undefined as AdvisorItemSource | undefined,
  // Notification filters
  notificationFilterStatuses: [] as string[],
  notificationFilterPriorities: [] as string[],
  get numNotificationFiltersApplied() {
    return [...this.notificationFilterStatuses, ...this.notificationFilterPriorities].length
  },
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
  setSelectedItem(id: string | undefined, source?: AdvisorItemSource) {
    advisorState.selectedItemId = id
    advisorState.selectedItemSource = source
  },
  focusItem({ id, tab, source }: { id: string; tab?: AdvisorTab; source?: AdvisorItemSource }) {
    if (tab) {
      advisorState.activeTab = tab
    }
    advisorState.selectedItemId = id
    advisorState.selectedItemSource = source
  },
  setNotificationFilters: (value: string, type: 'status' | 'priority') => {
    switch (type) {
      case 'status':
        if (advisorState.notificationFilterStatuses.includes(value)) {
          advisorState.notificationFilterStatuses = advisorState.notificationFilterStatuses.filter(
            (x) => x !== value
          )
        } else {
          advisorState.notificationFilterStatuses = advisorState.notificationFilterStatuses.concat([
            value,
          ])
        }
        break
      case 'priority':
        if (advisorState.notificationFilterPriorities.includes(value)) {
          advisorState.notificationFilterPriorities =
            advisorState.notificationFilterPriorities.filter((x) => x !== value)
        } else {
          advisorState.notificationFilterPriorities =
            advisorState.notificationFilterPriorities.concat([value])
        }
        break
    }
  },
  resetNotificationFilters() {
    advisorState.notificationFilterStatuses = []
    advisorState.notificationFilterPriorities = []
  },
  reset() {
    Object.assign(advisorState, initialState)
  },
})

export const getAdvisorStateSnapshot = () => snapshot(advisorState)

export const useAdvisorStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(advisorState, options)
