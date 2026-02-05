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
  const priority = ['read', 'write', 'create']

  for (const action of priority) {
    const index = remaining.indexOf(action)
    if (index !== -1) {
      sorted.push(action)
      remaining.splice(index, 1)
    }
  }

  const readWriteIndex = remaining.indexOf('read-write')
  if (readWriteIndex !== -1) {
    if (!sorted.includes('read') || !sorted.includes('write')) {
      sorted.push('read-write')
      remaining.splice(readWriteIndex, 1)
    } else {
      remaining.splice(readWriteIndex, 1)
    }
  }

  const noAccessIndex = remaining.indexOf('no access')
  if (noAccessIndex !== -1) {
    remaining.splice(noAccessIndex, 1)
  }
  sorted.push(...remaining)

  if (actions.includes('no access')) {
    sorted.push('no access')
  }

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

  const defaultAction = getBestAction(resource.actions)
  return [...permissionRows, { resource: resource.resource, action: defaultAction }]
}
