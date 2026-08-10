import type { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'

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
        {
          name: 'Environment Variables',
          key: 'environment-variables',
          url: `/project/${ref}/branches/environment-variables`,
          items: [],
        },
        {
          name: 'Config Storage',
          key: 'config-storage',
          url: `/project/${ref}/branches/config-storage`,
          items: [],
        },
      ],
    },
  ]
}
