import { ArrowRight } from 'lucide-react'

import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useTableEditorGotoCommands() {
  const project = useSelectedProject()
  const ref = project?.ref || '_'

  useRegisterCommands(
    'Go to',
    [
      {
        id: 'nav-table-editor',
        name: 'Go to Table Editor',
        route: `/project/${ref}/editor`,
        icon: () => <ArrowRight />,
      },
    ],
    { deps: [ref] }
  )
}
