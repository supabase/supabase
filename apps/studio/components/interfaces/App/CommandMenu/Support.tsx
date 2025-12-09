import { Activity, LifeBuoy } from 'lucide-react'
import { useMemo } from 'react'

import { IS_PLATFORM } from 'common'
import type { ICommand } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'

export const useSupportCommands = () => {
  const commands = useMemo(
    () =>
      [
        {
          id: 'system-status',
          name: 'View system status',
          value: 'Support: View system status',
          route: 'https://status.supabase.com',
          icon: () => <Activity />,
        },
        {
          id: 'discord-community',
          name: 'Ask Discord community',
          value: 'Support: Ask Discord community',
          route: 'https://discord.supabase.com',
          icon: () => <LifeBuoy />,
        },
        {
          id: 'support-team',
          name: 'Contact support',
          value: 'Support: Contact support',
          route: 'https://www.supabase.com/support',
          icon: () => <LifeBuoy />,
        },
      ] as Array<ICommand>,
    []
  )

  useRegisterCommands(COMMAND_MENU_SECTIONS.SUPPORT, commands, { enabled: IS_PLATFORM })
}
