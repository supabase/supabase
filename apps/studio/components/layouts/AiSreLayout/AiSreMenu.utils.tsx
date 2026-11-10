import { useParams } from 'common'

import type { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'

export const generateAiSreMenu = (ref?: string): ProductMenuGroup[] => {
  return [
    {
      title: 'AI SRE',
      items: [
        {
          name: 'Overview',
          key: 'overview',
          url: `/project/${ref}/ai-sre`,
          items: [],
        },
        {
          name: 'Integrations',
          key: 'integrations',
          url: `/project/${ref}/ai-sre/integrations`,
          items: [],
        },
        {
          name: 'Settings',
          key: 'settings',
          url: `/project/${ref}/ai-sre/settings`,
          items: [],
        },
      ],
    },
  ]
}

export const useGenerateAiSreMenu = (): ProductMenuGroup[] => {
  const { ref } = useParams()
  return generateAiSreMenu(ref)
}
