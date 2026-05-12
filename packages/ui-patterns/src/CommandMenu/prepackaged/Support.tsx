import { useRegisterCommands, useSetCommandMenuOpen, type ICommand } from '..'
import { Activity, LifeBuoy } from 'lucide-react'
import { useMemo } from 'react'

import { BASE_PATH } from './shared/constants'

const useSupportCommands = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const setOpen = useSetCommandMenuOpen()

  const commands = useMemo(
    () =>
      [
        {
          id: 'system-status',
          name: 'View system status',
          value: 'Support: View system status',
          href: 'https://status.supabase.com',
          icon: () => <Activity />,
        },
        {
          id: 'discord-community',
          name: 'Ask Discord community',
          value: 'Support: Ask Discord community',
          href: 'https://discord.supabase.com',
          icon: () => <LifeBuoy />,
        },
        {
          id: 'support-team',
          name: 'Contact support',
          value: 'Support: Contact support',
          href: '/support',
          icon: () => <LifeBuoy />,
        },
      ].map((command) => ({
        ...command,
        route:
          BASE_PATH && command.href.startsWith('/')
            ? `https://supabase.com/${command.href}`
            : command.href,
      })) as ICommand[],
    [setOpen]
  )

  useRegisterCommands('Support', commands, { enabled })
}

export { useSupportCommands }
