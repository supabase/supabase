import { useParams } from 'common'
import { ArrowRight } from 'lucide-react'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

const useAuthGoto = () => {
  const { ref } = useParams()

  useRegisterCommands(
    'Go to',
    [
      {
        id: 'nav-auth',
        name: 'Go to Auth',
        route: `/project/${ref || '_'}/auth/users`,
        icon: () => <ArrowRight />,
      },
    ],
    { deps: [ref] }
  )

  useRegisterCommands(
    'Find',
    [
      {
        id: 'nav-auth-users',
        name: 'Users',
        value: 'Auth: Users',
        route: `/project/${ref || '_'}/auth/users`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-policies',
        name: 'Policies',
        value: 'Auth: Policies (RLS)',
        route: `/project/${ref || '_'}/auth/policies`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-providers',
        name: 'Providers',
        value: 'Auth: Providers (Social Login, SSO)',
        route: `/project/${ref || '_'}/auth/providers`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-templates',
        name: 'Email Templates',
        value: 'Auth: Email Templates',
        route: `/project/${ref || '_'}/auth/templates`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-url-configuration',
        name: 'URL Configuration',
        value: 'Auth: URL Configuration (Site URL, Redirect URLs)',
        route: `/project/${ref || '_'}/auth/url-configuration`,
        defaultHidden: true,
      },
    ],
    { deps: [ref] }
  )
}

export { useAuthGoto }
