import { proxy, snapshot, useSnapshot } from 'valtio'
import { z } from 'zod'

export const advisorCategorySchema = z.enum(['security', 'performance', 'health', 'messages'])
export const advisorSeveritySchema = z.enum(['critical', 'warning', 'info'])

export type AdvisorCategory = z.infer<typeof advisorCategorySchema>
export type AdvisorSeverity = z.infer<typeof advisorSeveritySchema>
export type AdvisorItemSource = 'lint' | 'notification' | 'signal'

const createInitialState = () => ({
  // An empty selection means every category is shown, matching the severity filter
  categoryFilters: [] as AdvisorCategory[],
  severityFilters: ['critical', 'warning'] as AdvisorSeverity[],
  selectedItemId: undefined as string | undefined,
  selectedItemSource: undefined as AdvisorItemSource | undefined,
  // Notification filters
  notificationFilterStatuses: [] as string[],
  notificationFilterPriorities: [] as string[],
})

export const advisorState = proxy({
  ...createInitialState(),
  setCategoryFilters(categories: AdvisorCategory[]) {
    advisorState.categoryFilters = categories
  },
  setSeverityFilters(severities: AdvisorSeverity[]) {
    advisorState.severityFilters = severities
  },
  setSelectedItem(id: string | undefined, source?: AdvisorItemSource) {
    advisorState.selectedItemId = id
    advisorState.selectedItemSource = source
  },
  focusItem({ id, source }: { id: string; source?: AdvisorItemSource }) {
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
  /** Clears the filters that hide items within the selected categories, but not the categories themselves. */
  clearNarrowingFilters() {
    advisorState.severityFilters = []
    advisorState.notificationFilterStatuses = []
    advisorState.notificationFilterPriorities = []
  },
  clearFilters() {
    advisorState.categoryFilters = []
    advisorState.severityFilters = []
    advisorState.notificationFilterStatuses = []
    advisorState.notificationFilterPriorities = []
  },
  reset() {
    Object.assign(advisorState, createInitialState())
  },
})

export const getAdvisorStateSnapshot = () => snapshot(advisorState)

export const useAdvisorStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(advisorState, options)
