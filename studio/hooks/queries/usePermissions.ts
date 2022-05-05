import jsonLogic from 'json-logic-js'
import { find } from 'lodash'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { useStore } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { Organization, Project } from 'types'

export function usePermissions(action: string, resource: string, data?: object) {
  if (!IS_PLATFORM) return true

  const { app } = useStore()
  const router = useRouter()
  const url = `${API_URL}/profile/permissions`
  const { data: permissions, error } = useSWR<any>(url, get)
  if (error || !permissions || permissions.error) return false

  let organization_id: number | undefined
  const { ref, slug } = router.query
  if (ref) {
    const project = find(app.projects.list(), { ref }) as Project | undefined
    organization_id = project?.organization_id
  } else if (slug) {
    const organization = find(app.projects.list(), { ref }) as Organization | undefined
    organization_id = organization?.id
  }

  return permissions
    .filter(
      (permission: {
        actions: string[]
        condition: jsonLogic.RulesLogic
        organization_id: number
        resources: string[]
      }) =>
        permission.actions.some((act) => action.match(act.replace('.', '.').replace('%', '.*'))) &&
        permission.resources.some((res) =>
          resource.match(res.replace('.', '.').replace('%', '.*'))
        ) &&
        permission.organization_id === organization_id
    )
    .some(
      ({ condition }: { condition: jsonLogic.RulesLogic }) =>
        condition === null || jsonLogic.apply(condition, data)
    )
}
