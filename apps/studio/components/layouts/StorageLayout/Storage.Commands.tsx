import { ArrowRight } from 'lucide-react'

import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useStorageGotoCommands() {
  const project = useSelectedProject()
  const ref = project?.ref || '_'

  useRegisterCommands(
    'Go to',
    [
      {
        id: 'nav-storage',
        name: 'Go to Storage',
        route: `/project/${ref}/storage`,
        icon: () => <ArrowRight />,
      },
    ],
    { deps: [ref] }
  )
}
