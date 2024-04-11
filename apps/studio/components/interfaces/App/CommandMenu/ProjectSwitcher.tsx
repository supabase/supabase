import { useProjectsQuery } from 'data/projects/projects-query'
import { Forward, Wrench } from 'lucide-react'
import { useMemo } from 'react'
import {
  PageType,
  useRegisterCommands,
  useRegisterPage,
  useSetPage,
  useSetQuery,
} from 'ui-patterns/CommandMenu'

const PROJECT_SWITCHER_PAGE_NAME = 'Swith project'

const useProjectSwitchCommand = () => {
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
      sections: [
        {
          id: 'switch-project',
          name: 'Switch project',
          commands: projects.map(({ name, ref }) => ({
            id: `project-${ref}`,
            name,
            route: `/project/${ref}`,
            icon: () => <Forward />,
          })),
        },
      ],
    },
    { deps: [projects] }
  )

  useRegisterCommands('Project tools', [
    {
      id: 'switch-project',
      name: 'Switch project',
      value: 'Switch project, Change project, Select project',
      action: () => setPage(PROJECT_SWITCHER_PAGE_NAME),
      icon: () => <Wrench />,
    },
  ])
}

export { useProjectSwitchCommand }
