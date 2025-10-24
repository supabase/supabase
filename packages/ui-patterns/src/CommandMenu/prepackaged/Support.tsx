import { LifeBuoy, Activity } from 'lucide-react'
import { IconDiscordOutline } from 'ui'
import { useMemo } from 'react'

import { useRegisterCommands, useSetCommandMenuOpen, type ICommand } from '..'
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
          name: 'Ask the community',
          value: 'Support: Ask the community',
          href: 'https://discord.supabase.com',
          icon: () => <IconDiscordOutline />,
        },
        {
          id: 'support-team',
          name: 'Contact support team',
          value: 'Support: Contact support team',
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
