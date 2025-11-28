import { Building, Forward, Wrench } from 'lucide-react'
import { useMemo } from 'react'

import { IS_PLATFORM } from 'common'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsInfiniteQuery } from 'data/projects/projects-infinite-query'
import { PageType, useRegisterCommands, useRegisterPage, useSetPage } from 'ui-patterns/CommandMenu'
import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'

const PROJECT_SWITCHER_PAGE_NAME = 'Switch project'
const ORGANIZATION_SWITCHER_PAGE_NAME = 'Configure organization'

export function useProjectSwitchCommand() {
  const setPage = useSetPage()

  // [Joshen] Using paginated data here which means we won't be showing all projects
  // Ideally we somehow support searching with Cmd K if we want to make this ideal
  // e.g Cmd K input to support async searching while in "switch project" state
  const { data } = useProjectsInfiniteQuery({}, { enabled: IS_PLATFORM })
  const projects = useMemo(() => data?.pages.flatMap((page) => page.projects), [data?.pages]) || []

  useRegisterPage(
    PROJECT_SWITCHER_PAGE_NAME,
    {
      type: PageType.Commands,
      sections: [
        {
          id: 'switch-project',
          name: 'Switch project',
          commands: projects.map(({ name, ref }) => ({
            id: `project-${ref}`,
            name,
            value: `${name} (${ref})`,
            route: `/project/${ref}`,
            icon: () => <Forward />,
          })),
        },
      ],
    },
    { deps: [projects], enabled: !!projects && projects.length > 0 }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'switch-project',
        name: 'Switch project',
        value: 'Switch project, Change project, Select project',
        action: () => setPage(PROJECT_SWITCHER_PAGE_NAME),
        icon: () => <Wrench />,
      },
    ],
    { enabled: !!projects && projects.length > 0 }
  )
}

export function useConfigureOrganizationCommand() {
  const setPage = useSetPage()

  const { data: organizations } = useOrganizationsQuery({ enabled: IS_PLATFORM })

  useRegisterPage(
    ORGANIZATION_SWITCHER_PAGE_NAME,
    {
      type: PageType.Commands,
      sections: [
        {
          id: 'configure-organization',
          name: 'Configure organization',
          commands:
            organizations?.map(({ name, slug }) => ({
              id: `organization-${slug}`,
              name,
              value: `${name} (${slug})`,
              route: `/org/${slug}/general`,
              icon: () => <Building />,
            })) ?? [],
        },
      ],
    },
    { deps: [organizations], enabled: !!organizations && organizations.length > 0 }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'configure-organization',
        name: 'Configure organization',
        value: 'Configure organization, Change organization, Select organization',
        action: () => setPage(ORGANIZATION_SWITCHER_PAGE_NAME),
        icon: () => <Building />,
      },
    ],
    { enabled: !!organizations && organizations.length > 0 }
  )
}
