import { Forward, Wrench, Building } from 'lucide-react'
import { useMemo } from 'react'

import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { PageType, useRegisterCommands, useRegisterPage, useSetPage } from 'ui-patterns/CommandMenu'
import { IS_PLATFORM } from 'common'
import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'

const PROJECT_SWITCHER_PAGE_NAME = 'Switch project'

export function useProjectSwitchCommand() {
  const setPage = useSetPage()

  const { data: _projects } = useProjectsQuery({ enabled: IS_PLATFORM })
  const projects = useMemo(
    () => (_projects ?? []).map(({ name, ref }) => ({ name, ref })),
    [_projects]
  )

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

  const sectionTypes = [
    { id: 'general', name: 'General', route: 'general' },
    { id: 'billing', name: 'Billing', route: 'billing' },
    { id: 'usage', name: 'Usage', route: 'usage' },
    { id: 'integrations', name: 'Integrations', route: 'integrations' },
    { id: 'team', name: 'Manage Team', route: 'team' },
  ]

  const SECTION_TYPES_PAGE = 'Organization Section Types'
  const ORG_LIST_PAGE_PREFIX = 'Organization List - '

  useRegisterPage(
    SECTION_TYPES_PAGE,
    {
      type: PageType.Commands,
      sections: [
        {
          id: 'org-section-types',
          name: 'Configure organization',
          commands: sectionTypes.map(({ id, name }) => ({
            id: `org-section-type-${id}`,
            name,
            value: name,
            action: () => setPage(`${ORG_LIST_PAGE_PREFIX}${id}`),
            icon: () => <Building />,
          })),
        },
      ],
    },
    { deps: [sectionTypes], enabled: true }
  )

  sectionTypes.forEach(({ id, name, route }) => {
    useRegisterPage(
      `${ORG_LIST_PAGE_PREFIX}${id}`,
      {
        type: PageType.Commands,
        sections: [
          {
            id: `org-list-${id}`,
            name: `Select organization for ${name}`,
            commands:
              organizations?.map(({ name: orgName, slug }) => ({
                id: `org-${slug}-${id}`,
                name: orgName,
                value: `${orgName} (${slug})`,
                route: `/org/${slug}/${route}`,
                icon: () => <Building />,
              })) ?? [],
          },
        ],
      },
      { deps: [organizations], enabled: !!organizations && organizations.length > 0 }
    )
  })

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.ACTIONS,
    [
      {
        id: 'configure-organization',
        name: 'Configure organization',
        value: 'Configure organization, Organization settings, Manage organization',
        action: () => setPage(SECTION_TYPES_PAGE),
        icon: () => <Building />,
      },
    ],
    { enabled: true }
  )
}
