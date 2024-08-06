import { ArrowRight } from 'lucide-react'

import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

const useSqlEditorGotoCommands = () => {
  const project = useSelectedProject()
  const ref = project?.ref || '_'

  useRegisterCommands(
    'Go to',
    [
      {
        id: 'nav-sql-editor',
        name: 'Go to SQL Editor',
        route: `/project/${ref}/sql`,
        icon: () => <ArrowRight />,
      },
    ],
    { deps: [ref] }
  )
}

export { useSqlEditorGotoCommands }
