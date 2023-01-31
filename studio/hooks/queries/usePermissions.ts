import jsonLogic from 'json-logic-js'
import { useStore } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import useSWR from 'swr'

export function usePermissions(profile?: any, returning?: 'minimal') {
  let url = `${API_URL}/profile/permissions`

  if (returning) {
    const query = new URLSearchParams({ returning }).toString()
    url = `${url}?${query}`
  }

  const {
    data: data,
    error,
    mutate,
  } = useSWR<any>(profile !== undefined && IS_PLATFORM ? url : null, get, {
    loadingTimeout: 10000,
  })
  const anyError = data?.error || error

  return {
    permissions: IS_PLATFORM ? (anyError ? undefined : data) : [],
    isLoading: !anyError && !data,
    isError: !!anyError,
    mutate,
  }
}

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
  const orgid = organizationId ?? ui?.selectedOrganization?.id

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
        permission.organization_id === orgid
    )
    .some(
      ({ condition }: { condition: jsonLogic.RulesLogic }) =>
        condition === null || jsonLogic.apply(condition, { resource_name: resource, ...data })
    )
}
