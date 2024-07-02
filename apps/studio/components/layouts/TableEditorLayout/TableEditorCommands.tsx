import { useParams } from 'common'
import { ArrowRight } from 'lucide-react'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

const useTableEditorGoto = () => {
  const { ref } = useParams()

  useRegisterCommands(
    'Go to',
    [
      {
        id: 'nav-table-editor',
        name: 'Go to Table Editor',
        route: `/project/${ref || '_'}/editor`,
        icon: () => <ArrowRight />,
      },
    ],
    { deps: [ref] }
  )
}

export { useTableEditorGoto }
