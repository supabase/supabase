import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import {
  IntegrationDefinition,
  INTEGRATIONS,
} from 'components/interfaces/Integrations/Landing/Integrations.constants'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useIntegrationsGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  const getName = (integration: IntegrationDefinition) => {
    switch (integration.id) {
      case 'cron':
        return 'View and manage your Cron Jobs'
      case 'graphiql':
        return 'Query database using GraphQL'
      case 'vault':
        return 'View and manage your keys and secrets via Vault'
      default:
        return `View and manage your ${integration.name}${integration.type === 'wrapper' ? 's' : ''}`
    }
  }

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    INTEGRATIONS.map((x) => {
      return {
        id: `nav-integrations-${x.id}`,
        name: x.name,
        value: `Integrations: ${x.name}`,
        route: `/project/${ref}/integrations/${x.id}/overview`,
        defaultHidden: true,
      }
    }),
    { ...options, deps: [ref] }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.INTEGRATIONS,
    INTEGRATIONS.map((x) => {
      return {
        id: `manage-${x.id}`,
        name: getName(x),
        route: `/project/${ref}/integrations/${x.id}/overview`,
        icon: () => (
          <div className="w-6 h-6 relative bg-white border rounded-md flex items-center justify-center [&>img]:!p-1 [&>svg]:!p-1">
            {x.icon()}
          </div>
        ),
      }
    }),
    {
      ...options,
      deps: [ref],
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )
}
