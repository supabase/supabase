import { proxy, snapshot, useSnapshot } from 'valtio'

export const notificationsState = proxy({
  filterStatuses: [] as string[],
  filterPriorities: [] as string[],
  filterOrganizations: [] as string[],
  filterProjects: [] as string[],
  get numFiltersApplied() {
    return [
      ...this.filterStatuses,
      ...this.filterPriorities,
      ...this.filterOrganizations,
      ...this.filterProjects,
    ].length
  },
  setFilters: (value: string, type: 'status' | 'priority' | 'organizations' | 'projects') => {
    switch (type) {
      case 'status':
        if (notificationsState.filterStatuses.includes(value)) {
          notificationsState.filterStatuses = notificationsState.filterStatuses.filter(
            (x) => x !== value
          )
        } else {
          notificationsState.filterStatuses = notificationsState.filterStatuses.concat([value])
        }
        break
      case 'priority':
        if (notificationsState.filterPriorities.includes(value)) {
          notificationsState.filterPriorities = notificationsState.filterPriorities.filter(
            (x) => x !== value
          )
        } else {
          notificationsState.filterPriorities = notificationsState.filterPriorities.concat([value])
        }
        break
      case 'organizations':
        if (notificationsState.filterOrganizations.includes(value)) {
          notificationsState.filterOrganizations = notificationsState.filterOrganizations.filter(
            (x) => x !== value
          )
        } else {
          notificationsState.filterOrganizations = notificationsState.filterOrganizations.concat([
            value,
          ])
        }
        break
      case 'projects':
        if (notificationsState.filterProjects.includes(value)) {
          notificationsState.filterProjects = notificationsState.filterProjects.filter(
            (x) => x !== value
          )
        } else {
          notificationsState.filterProjects = notificationsState.filterProjects.concat([value])
        }
        break
    }
  },
  resetFilters: () => {
    notificationsState.filterStatuses = []
    notificationsState.filterPriorities = []
    notificationsState.filterOrganizations = []
    notificationsState.filterProjects = []
  },
})

export const getNotificationsStateSnapshot = () => snapshot(notificationsState)

export const useNotificationsStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(notificationsState, options)
