import jsonLogic from 'json-logic-js'
import { find } from 'lodash'
import { useRouter } from 'next/router'

import { useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { Organization, Project } from 'types'

// [Joshen] Should we be using a hook here?

export function checkPermissions(action: string, resource: string, data?: object) {
  if (!IS_PLATFORM) return true

  const { app, ui } = useStore()
  const router = useRouter()

  let organization_id: number | undefined
  const { ref, slug } = router.query
  if (ref) {
    const project = find(app.projects.list(), { ref }) as Project | undefined
    organization_id = project?.organization_id
  } else if (slug) {
    const organization = find(app.projects.list(), { ref }) as Organization | undefined
    organization_id = organization?.id
  }

  return ui.permissions
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
        condition === null || jsonLogic.apply(condition, data)
    )
}
