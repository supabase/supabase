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

// The default action(s) selected when a resource is first added. Newly added
// resources should be least-privilege by default: just `read` when available,
// otherwise the first available action — never the resource's full action set.
export const getDefaultActions = (resource: PermissionResource): string[] => {
  return resource.actions.includes('read') ? ['read'] : [resource.actions[0]]
}

export const togglePermissionResource = (
  permissionRows: PermissionRow[],
  resource: PermissionResource
): PermissionRow[] => {
  const isAlreadyAdded = permissionRows.some((row) => row.resource === resource.resource)

  if (isAlreadyAdded) {
    return permissionRows.filter((row) => row.resource !== resource.resource)
  }

  return [...permissionRows, { resource: resource.resource, actions: getDefaultActions(resource) }]
}
