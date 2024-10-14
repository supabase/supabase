import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'

export const generateReplicationMenu = (project: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    {
      title: 'Configuration',
      items: [
        {
          name: 'Sources',
          key: 'sources',
          url: `/project/${ref}/replication/sources`,
          items: [],
        },
        {
          name: 'Sinks',
          key: 'sinks',
          url: `/project/${ref}/replication/sinks`,
          items: [],
        },
        {
          name: 'Pipelines',
          key: 'pipelines',
          url: `/project/${ref}/replication/pipelines`,
          items: [],
        },
      ],
    },
  ]
}
