import { Table2 } from 'lucide-react'

import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useProjectLevelTableEditorCommands(options?: CommandOptions) {
  const { data: project } = useSelectedProjectQuery()
  const { slug } = useParams()
  const ref = project?.ref || '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.TABLE,
    [
      {
        id: 'create-table',
        name: 'Create new table',
        route: `/org/${slug}/project/${ref}/editor?create=table`,
        icon: () => <Table2 />,
      },
    ],
    {
      ...options,
      deps: [ref],
      enabled: (options?.enabled ?? true) && !!project,
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )
}

export function useTableEditorGotoCommands(options?: CommandOptions) {
  let { slug, ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.TABLE,
    [
      {
        id: 'view-tables',
        name: 'View your tables',
        route: `/org/${slug}/project/${ref}/editor`,
        icon: () => <Table2 />,
      },
    ],
    {
      ...options,
      deps: [ref],
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-table-editor',
        name: 'Table Editor',
        route: `/org/${slug}/project/${ref}/editor`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
