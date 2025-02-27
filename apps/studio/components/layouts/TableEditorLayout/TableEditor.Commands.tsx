import { Table2 } from 'lucide-react'

import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useProjectLevelTableEditorCommands(options?: CommandOptions) {
  let project = useSelectedProject()
  const ref = project?.ref || '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'create-table',
        name: 'Create new table',
        route: `/project/${ref}/editor?create=table`,
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
  let { ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'view-tables',
        name: 'View your tables',
        route: `/project/${ref}/editor`,
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
        route: `/project/${ref}/editor`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
