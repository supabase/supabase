import { useParams } from 'common'
import { ArrowRight } from 'lucide-react'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

const useFunctionsGoto = () => {
  const { ref } = useParams()

  useRegisterCommands(
    'Go to',
    [
      {
        id: 'nav-functions',
        name: 'Go to Edge Functions',
        route: `/project/${ref || '_'}/functions`,
        icon: () => <ArrowRight />,
      },
    ],
    { deps: [ref] }
  )
}

export { useFunctionsGoto }
