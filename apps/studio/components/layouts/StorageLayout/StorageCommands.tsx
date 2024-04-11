import { useParams } from 'common'
import { ArrowRight } from 'lucide-react'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

const useStorageGoto = () => {
  const { ref } = useParams()

  useRegisterCommands(
    'Go to',
    [
      {
        id: 'nav-storage',
        name: 'Go to Storage',
        route: `/project/${ref || '_'}/storage`,
        icon: () => <ArrowRight />,
      },
    ],
    { deps: [ref] }
  )
}

export { useStorageGoto }
