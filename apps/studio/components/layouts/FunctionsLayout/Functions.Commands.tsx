import { ArrowRight } from 'lucide-react'

import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useFunctionsGotoCommands() {
  const project = useSelectedProject()
  const ref = project?.ref || '_'

  useRegisterCommands(
    'Go to',
    [
      {
        id: 'nav-functions',
        name: 'Go to Edge Functions',
        route: `/project/${ref}/functions`,
        icon: () => <ArrowRight />,
      },
    ],
    { deps: [ref] }
  )
}
