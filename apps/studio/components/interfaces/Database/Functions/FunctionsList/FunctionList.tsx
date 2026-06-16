import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { includes, noop, sortBy } from 'lodash'
import { Copy, Edit, Edit2, FileText, MoreVertical, Trash } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'

import { stripInArgModePrefixes } from '../Functions.utils'
import { getDatabaseTriggersHref } from './FunctionList.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  useDatabaseFunctionsQuery,
  type SavedDatabaseFunction,
} from '@/data/database-functions/database-functions-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

interface FunctionListProps {
  filterString: string
  isLocked: boolean
  returnTypeFilter: string[]
  securityFilter: string[]
  duplicateFunction: (fn: SavedDatabaseFunction) => void
  editFunction: (fn: SavedDatabaseFunction) => void
  deleteFunction: (fn: SavedDatabaseFunction) => void
}

export const FunctionList = ({
  filterString,
  isLocked,
  returnTypeFilter,
  securityFilter,
  duplicateFunction = noop,
  editFunction = noop,
  deleteFunction = noop,
}: FunctionListProps) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { selectedSchema: schema } = useQuerySchemaState()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const { data: functions = [] } = useDatabaseFunctionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema,
  })

  const filteredFunctions = (functions ?? []).filter((x) => {
    const matchesName = includes(x.name.toLowerCase(), filterString.toLowerCase())
    const matchesReturnType =
      returnTypeFilter.length === 0 || returnTypeFilter.includes(x.return_type)
    const matchesSecurity =
      securityFilter.length === 0 ||
      (securityFilter.includes('definer') && x.security_definer) ||
      (securityFilter.includes('invoker') && !x.security_definer)
    return matchesName && matchesReturnType && matchesSecurity
  })

  const _functions = sortBy(
    filteredFunctions.filter((x) => x.schema == schema),
    (func) => func.name.toLocaleLowerCase()
  )

  const { can: canUpdateFunctions } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'functions'
  )

  if (_functions.length === 0 && filterString.length === 0) {
    return (
      <TableRow key={schema}>
        <TableCell colSpan={5}>
          <p className="text-sm text-foreground">No functions created yet</p>
          <p className="text-sm text-foreground-light">
            There are no functions found in the schema "{schema}"
          </p>
        </TableCell>
      </TableRow>
    )
  }

  if (_functions.length === 0 && filterString.length > 0) {
    return (
      <TableRow key={schema}>
        <TableCell colSpan={5}>
          <p className="text-sm text-foreground">No results found</p>
          <p className="text-sm text-foreground-light">
            Your search for "{filterString}" did not return any results
          </p>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {_functions.map((x) => {
        const isApiDocumentAvailable = schema === 'public' && x.return_type !== 'trigger'
        const argumentTypes =
          x.type === 'procedure' ? stripInArgModePrefixes(x.argument_types) : x.argument_types

        return (
          <TableRow key={x.id}>
            <TableCell className="truncate">
              <Button
                type="text"
                className="text-link-table-cell text-sm disabled:opacity-100 disabled:no-underline p-0 hover:bg-transparent title"
                disabled={isLocked || !canUpdateFunctions}
                onClick={() => editFunction(x)}
                title={x.name}
              >
                {x.name}
              </Button>
            </TableCell>
            <TableCell className="table-cell text-foreground-light capitalize">{x.type}</TableCell>
            <TableCell className="table-cell">
              <p
                title={argumentTypes}
                className={`truncate ${argumentTypes ? 'text-foreground-light' : 'text-foreground-muted'}`}
              >
                {argumentTypes || '–'}
              </p>
            </TableCell>
            <TableCell className="table-cell">
              {x.return_type === 'trigger' ? (
                <Link
                  href={getDatabaseTriggersHref(projectRef, x.name)}
                  className="truncate text-link"
                  title={x.return_type}
                >
                  {x.return_type}
                </Link>
              ) : (
                <p
                  title={x.return_type}
                  className={cn(
                    'truncate',
                    x.return_type === null ? 'text-foreground-muted' : 'text-foreground-light'
                  )}
                >
                  {x.return_type === null ? '–' : x.return_type}
                </p>
              )}
            </TableCell>
            <TableCell className="table-cell">
              <p className="truncate text-foreground-light">
                {x.security_definer ? 'Definer' : 'Invoker'}
              </p>
            </TableCell>
            <TableCell className="text-right">
              {!isLocked && (
                <div className="flex items-center justify-end">
                  {canUpdateFunctions ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label="More options"
                          type="default"
                          className="px-1"
                          icon={<MoreVertical />}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="left" className="w-52">
                        {isApiDocumentAvailable && (
                          <>
                            <DropdownMenuItem
                              className="space-x-2"
                              onClick={() =>
                                router.push(`/project/${projectRef}/api?rpc=${x.name}`)
                              }
                            >
                              <FileText size={14} />
                              <p>Client API docs</p>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem className="space-x-2" onClick={() => editFunction(x)}>
                          <Edit2 size={14} />
                          <p>Edit function</p>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="space-x-2"
                          onClick={() => {
                            openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
                            aiSnap.newChat({
                              name: `Update function ${x.name}`,
                              initialInput: 'Update this function to do...',
                              suggestions: {
                                title:
                                  'I can help you make a change to this function, here are a few example prompts to get you started:',
                                prompts: [
                                  {
                                    label: 'Rename Function',
                                    description: 'Rename this function to ...',
                                  },
                                  {
                                    label: 'Modify Function',
                                    description: 'Modify this function so that it ...',
                                  },
                                  {
                                    label: 'Add Trigger',
                                    description:
                                      'Add a trigger for this function that calls it when ...',
                                  },
                                ],
                              },
                              sqlSnippets: [x.complete_statement],
                            })
                          }}
                        >
                          <Edit size={14} />
                          <p>Edit function with Assistant</p>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="space-x-2"
                          onClick={() => duplicateFunction(x)}
                        >
                          <Copy size={14} />
                          <p>Duplicate function</p>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="space-x-2" onClick={() => deleteFunction(x)}>
                          <Trash size={14} className="text-destructive" />
                          <p>Delete function</p>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <ButtonTooltip
                      disabled
                      type="default"
                      icon={<MoreVertical />}
                      className="px-1"
                      tooltip={{
                        content: {
                          side: 'left',
                          text: 'You need additional permissions to update functions',
                        },
                      }}
                    />
                  )}
                </div>
              )}
            </TableCell>
          </TableRow>
        )
      })}
    </>
  )
}
