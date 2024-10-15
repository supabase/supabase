import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'

export const generateReplicationMenu = (project: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    {
      title: 'Replication Status',
      items: [
        {
          name: 'Status',
          key: 'replication',
          url: `/project/${ref}/replication`,
          items: [],
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
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
