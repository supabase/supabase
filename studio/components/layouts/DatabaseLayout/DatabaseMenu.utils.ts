import { Project } from 'types'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { useFlag } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'

export const generateDatabaseMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  const HOOKS_RELEASED = '2021-07-30T15:33:54.383Z'
  const showHooksRoute = project?.inserted_at ? project.inserted_at > HOOKS_RELEASED : false

  const foreignDataWrappersEnabled = useFlag('foreignDataWrappers')

  return [
    {
      title: 'Database',
      items: [
        { name: 'Tables', key: 'tables', url: `/project/${ref}/database/tables`, items: [] },
        {
          name: 'Triggers',
          key: 'triggers',
          url: `/project/${ref}/database/triggers`,
          items: [],
        },
        {
          name: 'Functions',
          key: 'functions',
          url: `/project/${ref}/database/functions`,
          items: [],
        },
        {
          name: 'Extensions',
          key: 'extensions',
          url: `/project/${ref}/database/extensions`,
          items: [],
        },
        { name: 'Roles', key: 'roles', url: `/project/${ref}/database/roles`, items: [] },
        {
          name: 'Replication',
          key: 'replication',
          url: `/project/${ref}/database/replication`,
          items: [],
        },
        ...(showHooksRoute
          ? [
              {
                name: 'Webhooks',
                key: 'hooks',
                url: `/project/${ref}/database/hooks`,
                items: [],
                label: 'ALPHA',
              },
            ]
          : []),
        ...(foreignDataWrappersEnabled
          ? [
              {
                name: 'Wrappers',
                key: 'wrappers',
                url: `/project/${ref}/database/wrappers`,
                items: [],
                label: 'ALPHA',
              },
            ]
          : []),
        ...(IS_PLATFORM
          ? [
              {
                name: 'Backups',
                key: 'backups',
                url: `/project/${ref}/database/backups/scheduled`,
                items: [],
              },
            ]
          : []),
      ],
    },
  ]
}
