import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'

export const generateBranchMenu = (ref: string): ProductMenuGroup[] => {
  return [
    {
      title: 'Manage',
      items: [
        {
          name: 'Branches',
          key: 'branches',
          url: `/project/${ref}/branches`,
          items: [],
        },
        {
          name: 'Merge requests',
          key: 'merge-requests',
          url: `/project/${ref}/branches/merge-requests`,
          items: [],
        },
      ],
    },
  ]
}
