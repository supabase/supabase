import { PermissionResource, PermissionRow } from './Permissions.types'

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

export const getDefaultPermissionActions = (actions: string[]): string[] => {
  const firstAvailableAction = actions[0]

  if (actions.includes('read')) {
    return ['read']
  }

  return firstAvailableAction ? [firstAvailableAction] : []
}

export const togglePermissionResource = (
  permissionRows: PermissionRow[],
  resource: PermissionResource
): PermissionRow[] => {
  const isAlreadyAdded = permissionRows.some((row) => row.resource === resource.resource)

  if (isAlreadyAdded) {
    return permissionRows.filter((row) => row.resource !== resource.resource)
  }

  return [
    ...permissionRows,
    { resource: resource.resource, actions: getDefaultPermissionActions(resource.actions) },
  ]
}
