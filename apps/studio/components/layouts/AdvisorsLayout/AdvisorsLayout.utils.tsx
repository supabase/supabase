import type { ProductMenuGroupItem } from 'components/ui/ProductMenu/ProductMenu.types'

export const generateAdvisorsPageItemsMenu = (
  ref: string,
  flags?: {
    pgNetExtensionExists: boolean
    pitrEnabled: boolean
    columnLevelPrivileges: boolean
  }
): ProductMenuGroupItem[] => {
  return [
    {
      name: 'Security',
      key: 'security',
      url: `/project/${ref}/advisors/security`,
    },
    {
      name: 'Performance',
      key: 'performance',
      url: `/project/${ref}/advisors/performance`,
    },
    {
      name: 'Query',
      key: 'query',
      url: `/project/${ref}/advisors/query-performance`,
    },
  ]
}
