import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { Project } from 'types'

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
      ],
    },
  ]
}
