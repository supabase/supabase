import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { ArrowUpRight } from 'lucide-react'

export const generateRealtimeMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    {
      title: 'Realtime',
      items: [
        {
          name: 'Inspector',
          key: 'inspector',
          url: `/project/${ref}/realtime/inspector`,
          items: [],
        },
        {
          name: 'Policies',
          key: 'policies',
          url: `/project/${ref}/auth/policies?schema=realtime`,
          rightIcon: <ArrowUpRight strokeWidth={1} />,
          items: [],
        },
      ],
    },
  ]
}
