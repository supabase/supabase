import { LifeBuoy } from 'lucide-react'
import { useRegisterCommands } from '../api/hooks/commandsHooks'
import { type ICommand } from '../internal/Command'
import { useSetCommandMenuOpen } from '../api/hooks/viewHooks'
import { useMemo } from 'react'
import { BASE_PATH } from './shared/constants'

const useSupportCommands = () => {
  const setOpen = useSetCommandMenuOpen()

  const commands = useMemo(
    () =>
      [
        {
          id: 'support',
          name: 'Go to Support',
          value: 'Support: Go to Support',
          href: '/support',
          icon: () => <LifeBuoy />,
        },
        {
          id: 'system-status',
          name: 'Go to System Status',
          value: 'Support: Go to System Status',
          href: 'https://status.supabase.com',
          icon: () => <LifeBuoy />,
        },
        {
          id: 'github-discussions',
          name: 'Go to GitHub Discussions',
          value: 'Support: Go to GitHub Discussions',
          href: 'https://github.com/orgs/supabase/discussions',
          icon: () => <LifeBuoy />,
        },
      ].map((command) =>
        !BASE_PATH && command.href.startsWith('/')
          ? { ...command, route: command.href }
          : {
              ...command,
              action: () => {
                window.open(
                  command.href.startsWith('/')
                    ? `https://supabase.com/${command.href}`
                    : command.href,
                  '_blank',
                  'noreferrer,noopener'
                )
                setOpen(false)
              },
            }
      ) as ICommand[],
    [setOpen]
  )

  useRegisterCommands('Support', commands)
}

export { useSupportCommands }
