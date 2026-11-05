import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { FunctionSquareIcon, ShieldIcon, ZapIcon } from 'lucide-react'
import type { ICommand } from 'ui-patterns/CommandMenu'
import {
  useCommandMenuOpen,
  useQuery as useCommandMenuQuery,
  useCurrentPage,
  useRegisterCommands,
} from 'ui-patterns/CommandMenu'

import {
  formatRelatedFunctionDetails,
  formatRelatedPolicyDetails,
  formatRelatedTriggerDetails,
} from './TableRelatedResources.utils'
import { COMMAND_MENU_SECTIONS } from '@/components/interfaces/App/CommandMenu/CommandMenu.utils'
import {
  getFunctionEditorRoute,
  getPolicyEditorRoute,
  getTriggerEditorRoute,
} from '@/components/interfaces/App/CommandMenu/DatabaseEntitySearch.utils'
import { orderCommandSectionsByPriority } from '@/components/interfaces/App/CommandMenu/ordering'
import {
  tableReferencingFunctionsQueryOptions,
  tableRelatedResourcesQueryOptions,
} from '@/data/database/table-related-resources-query'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useGrant } from '@/lib/grants'

// Above Shortcuts, which registers at 1
const RELATED_RESOURCES_PRIORITY = 0

const Badge = ({ children }: { children: string }) => (
  <span className="text-xs text-foreground-lighter truncate pl-4 shrink-0">{children}</span>
)

/**
 * Lists the policies, triggers and functions tied to the table currently open
 * in the table editor, so the command menu answers "what else touches this
 * table?" without the user having to type its name.
 *
 * Registered from the table editor layout, so it is scoped to that route.
 * Searching replaces this with the entity search, which covers the whole
 * project, so the section is dropped as soon as the user types.
 */
export function useTableRelatedResourcesCommands() {
  const { id } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const isOpen = useCommandMenuOpen()
  const commandMenuQuery = useCommandMenuQuery()
  const isRootLevel = useCurrentPage() === undefined

  const tableId = Number(id)
  const { data: table } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id: Number.isFinite(tableId) ? tableId : undefined,
  })

  const grantResult = useGrant('POST /platform/pg-meta/{ref}/query', { projectRef: project?.ref })

  const canShowSection = isOpen && isRootLevel && commandMenuQuery.trim().length === 0

  const variables = {
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: table?.schema,
    name: table?.name,
    grant: grantResult.grant,
  }

  // Two queries on purpose: policies and triggers are index probes that come
  // back immediately, while the functions are found by reading function bodies
  // and can take a few hundred milliseconds. Splitting them lets the rest of
  // the section render without waiting.
  const { data } = useQuery(
    tableRelatedResourcesQueryOptions(variables, { enabled: canShowSection })
  )
  const { data: functionData } = useQuery(
    tableReferencingFunctionsQueryOptions(variables, { enabled: canShowSection })
  )

  const projectRef = project?.ref ?? '_'
  const policies = canShowSection ? (data?.policies ?? []) : []
  const triggers = canShowSection ? (data?.triggers ?? []) : []
  const functions = canShowSection ? (functionData?.functions ?? []) : []

  const commands: ICommand[] = [
    ...policies.map((policy) => ({
      id: `related-policy-${policy.id}`,
      name: policy.name,
      icon: () => <ShieldIcon />,
      badge: () => <Badge>{formatRelatedPolicyDetails(policy.command)}</Badge>,
      route: getPolicyEditorRoute(projectRef, policy),
    })),
    ...triggers.map((trigger) => ({
      id: `related-trigger-${trigger.id}`,
      name: trigger.name,
      icon: () => <ZapIcon />,
      badge: () => <Badge>{formatRelatedTriggerDetails(trigger)}</Badge>,
      route: getTriggerEditorRoute(projectRef, trigger),
    })),
    ...functions.map((fn) => ({
      id: `related-function-${fn.id}`,
      name: `${fn.schema}.${fn.name}`,
      icon: () => <FunctionSquareIcon />,
      badge: () => <Badge>{formatRelatedFunctionDetails(fn)}</Badge>,
      route: getFunctionEditorRoute(projectRef, fn),
    })),
  ]

  useRegisterCommands(COMMAND_MENU_SECTIONS.RELATED_RESOURCES, commands, {
    deps: [data, functionData, canShowSection, projectRef],
    enabled: canShowSection && commands.length > 0,
    orderSection: orderCommandSectionsByPriority,
    sectionMeta: { priority: RELATED_RESOURCES_PRIORITY },
  })
}
