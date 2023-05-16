import { useStore } from 'hooks'
import jsonLogic from 'json-logic-js'
import { IS_PLATFORM } from 'lib/constants'

const toRegexpString = (actionOrResource: string) =>
  `^${actionOrResource.replace('.', '\\.').replace('%', '.*')}$`

export function checkPermissions(
  action: string,
  resource: string,
  data?: object,
  organizationId?: number
) {
  if (!IS_PLATFORM) return true

  const { ui } = useStore()
  const orgId = organizationId ?? ui?.selectedOrganization?.id

  return (ui?.permissions ?? [])
    .filter(
      (permission: {
        actions: string[]
        condition: jsonLogic.RulesLogic
        organization_id: number
        resources: string[]
      }) =>
        permission.actions.some((act) => (action ? action.match(toRegexpString(act)) : null)) &&
        permission.resources.some((res) => resource.match(toRegexpString(res))) &&
        permission.organization_id === orgId
    )
    .some(
      ({ condition }: { condition: jsonLogic.RulesLogic }) =>
        condition === null || jsonLogic.apply(condition, { resource_name: resource, ...data })
    )
}
