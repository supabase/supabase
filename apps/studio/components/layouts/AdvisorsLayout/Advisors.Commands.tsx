import { AlertTriangle, ArrowRight } from 'lucide-react'

import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { useProjectLintsQuery } from 'data/lint/lint-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useAdvisorsGoToCommands() {
  const project = useSelectedProject()
  const ref = project?.ref || '_'

  useRegisterCommands(
    'Go to',
    [
      {
        id: 'nav-advisors',
        name: 'Go to Advisors',
        value: 'Go to Advisors: Security',
        route: `/project/${ref}/advisors/security`,
        icon: () => <ArrowRight />,
      },
    ],
    { deps: [ref] }
  )

  useRegisterCommands(
    'Find',
    [
      {
        id: 'nav-advisors-performance',
        name: 'Performance Advisor',
        route: `/project/${ref}/advisors/performance`,
        defaultHidden: true,
      },
    ],
    { deps: [ref] }
  )
}

export function useAdvisorsLintCommands() {
  const project = useSelectedProject()
  const { data } = useProjectLintsQuery({
    projectRef: project?.ref,
  })
  const ref = project?.ref || '_'

  const numberImportantLints = (data ?? []).filter(
    (lint) => lint.level === 'ERROR' || lint.level === 'WARN'
  ).length

  useRegisterCommands(
    'Advisor warnings',
    [
      {
        id: 'advisor-warnings',
        name: `Advisor: Address ${numberImportantLints} security and performance issues`,
        icon: () => <AlertTriangle className="text-amber-800" />,
        route: `/project/${ref}/advisors/security`,
      },
    ],
    {
      enabled: numberImportantLints > 0,
      deps: [numberImportantLints, ref],
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: {
        priority: 1,
      },
    }
  )
}
