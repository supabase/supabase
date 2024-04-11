import { useParams } from 'common'
import { ArrowRight } from 'lucide-react'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

const useSqlEditorGoto = () => {
  const { ref } = useParams()

  useRegisterCommands(
    'Go to',
    [
      {
        id: 'nav-sql-editor',
        name: 'Go to SQL Editor',
        route: `/project/${ref || '_'}/sql`,
        icon: () => <ArrowRight />,
      },
    ],
    { deps: [ref] }
  )
}

export { useSqlEditorGoto }
