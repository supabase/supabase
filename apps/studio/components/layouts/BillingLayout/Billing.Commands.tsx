import { IS_PLATFORM } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useBillingGotoCommands(options?: CommandOptions) {
  const { data: organization } = useSelectedOrganizationQuery()
  const billingEnabled = useIsFeatureEnabled('billing:all')
  const slug = organization?.slug ?? '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    IS_PLATFORM && billingEnabled
      ? [
          {
            id: 'nav-billing',
            name: 'Billing',
            route: `/org/${slug}/billing`,
            defaultHidden: true,
          },
        ]
      : [],
    { ...options, deps: [slug] }
  )
}
