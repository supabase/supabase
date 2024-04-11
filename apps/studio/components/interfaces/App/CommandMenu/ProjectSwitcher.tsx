import { useProjectsQuery } from 'data/projects/projects-query'
import { useMemo } from 'react'
import {
  PageType,
  useRegisterCommands,
  useRegisterPage,
  useSetPage,
  useSetQuery,
} from 'ui-patterns/CommandMenu'

const PROJECT_SWITCHER_PAGE_NAME = 'switch-project'

const useProjectSwitchCommand = () => {
  const setQuery = useSetQuery()
  const setPage = useSetPage()

  const { data: _projects } = useProjectsQuery()
  const projects = useMemo(
    () => (_projects ?? []).map(({ name, ref }) => ({ name, ref })),
    [_projects]
  )

  useRegisterPage(
    PROJECT_SWITCHER_PAGE_NAME,
    {
      type: PageType.Commands,
      commands: [
        {
          id: 'switch-project',
          name: 'Switch project',
          commands: projects.map(({ name, ref }) => ({
            id: `project-${ref}`,
            name,
            route: `/project/${ref}`,
          })),
        },
      ],
    },
    [projects]
  )

  useRegisterCommands('Project tools', [
    {
      id: 'switch-project',
      name: 'Switch project',
      action: () => setPage(PROJECT_SWITCHER_PAGE_NAME),
    },
  ])
}

export { useProjectSwitchCommand }
