import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'

export const generateAdvisorsMenu = (
  project?: Project,
  features?: { advisorRules: boolean }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  const menu: ProductMenuGroup[] = []

  if (IS_PLATFORM && features?.advisorRules) {
    menu.push({
      title: 'Configuration',
      items: [
        {
          name: 'Settings',
          key: 'rules',
          url: `/project/${ref}/advisors/rules/security`,
          items: [],
        },
      ],
    })
  }

  return menu
}
