import { PermissionResource, PermissionRow } from './Permissions.types'

const getBestAction = (actions: string[]): string => {
  const availableActions = actions.filter((a) => a !== 'no access')

  if (availableActions.length === 0) return 'no access'

  const priority = ['read', 'write', 'create', 'delete', 'read-write']

  for (const priorityAction of priority) {
    if (availableActions.includes(priorityAction)) {
      return priorityAction
    }
  }

  return availableActions[0]
}

export const sortActions = (actions: string[]): string[] => {
  const sorted: string[] = []
  const remaining = [...actions]
  const priority = ['read', 'write', 'create', 'delete']

  for (const action of priority) {
    const index = remaining.indexOf(action)
    if (index !== -1) {
      sorted.push(action)
      remaining.splice(index, 1)
    }
  }

  sorted.push(...remaining)
  return sorted
}

export const togglePermissionResource = (
  permissionRows: PermissionRow[],
  resource: PermissionResource
): PermissionRow[] => {
  const isAlreadyAdded = permissionRows.some((row) => row.resource === resource.resource)

  if (isAlreadyAdded) {
    return permissionRows.filter((row) => row.resource !== resource.resource)
  }

  const defaultActions = resource.actions.includes('read') ? ['read'] : [resource.actions[0]]
  return [...permissionRows, { resource: resource.resource, actions: defaultActions }]
}
