import { ArrowRight } from 'lucide-react'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { useParams } from 'common'

const useApiDocsGoto = () => {
  let { ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    'Go to',
    [
      {
        id: 'nav-api',
        name: 'Go to Project API Docs',
        route: `/project/${ref}/api`,
        icon: () => <ArrowRight />,
      },
    ],
    { deps: [ref] }
  )

  useRegisterCommands(
    'Find',
    [
      {
        id: 'nav-api-aut',
        name: 'Auth Docs',
        route: `/project/${ref}/api?page=auth`,
        defaultHidden: true,
      },
      {
        id: 'nav-api-user-management',
        name: 'User Management Docs',
        route: `/project/${ref}/api?page=users`,
        defaultHidden: true,
      },
      {
        id: 'nav-api-graphql',
        name: 'GraphQL Docs',
        route: `/project/${ref}/api/graphiql`,
        defaultHidden: true,
      },
    ],
    { deps: [ref] }
  )
}

export { useApiDocsGoto }
