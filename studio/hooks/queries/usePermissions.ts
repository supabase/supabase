import useSWR from 'swr'
import jsonLogic from 'json-logic-js'

import { useFlag, useStore } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'

export function usePermissions(returning?: 'minimal') {
  let url = `${API_URL}/profile/permissions`

  if (returning) {
    const query = new URLSearchParams({ returning }).toString()
    url = `${url}?${query}`
  }

  const { data: data, error } = useSWR<any>(url, get, { loadingTimeout: 10000 })
  const anyError = data?.error || error

  return {
    permissions: anyError ? undefined : data,
    isLoading: !anyError && !data,
    isError: !!anyError,
  }
}

export function checkPermissions(action: string, resource: string, data?: object) {
  if (!IS_PLATFORM) return true

  const enablePermissions = useFlag('enablePermissions')
  if (!enablePermissions) return true

  const { ui } = useStore()

  return (ui?.permissions ?? [])
    .filter(
      (permission: {
        actions: string[]
        condition: jsonLogic.RulesLogic
        organization_id: number
        resources: string[]
      }) =>
        permission.actions.some((act) =>
          action ? action.match(act.replace('.', '.').replace('%', '.*')) : null
        ) &&
        permission.resources.some((res) =>
          resource.match(res.replace('.', '.').replace('%', '.*'))
        ) &&
        permission.organization_id === ui?.selectedOrganization?.id
    )
    .some(
      ({ condition }: { condition: jsonLogic.RulesLogic }) =>
        condition === null || jsonLogic.apply(condition, { resource_name: resource, ...data })
    )
}
