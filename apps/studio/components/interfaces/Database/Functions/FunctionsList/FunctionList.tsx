import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes, noop, sortBy } from 'lodash'
import { Edit, Edit2, FileText, MoreVertical, Trash } from 'lucide-react'
import { useRouter } from 'next/router'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabaseFunctionsQuery } from 'data/database-functions/database-functions-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { useIsDatabaseFunctionsAssistantEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'

interface FunctionListProps {
  schema: string
  filterString: string
  isLocked: boolean
  editFunction: (fn: any) => void
  deleteFunction: (fn: any) => void
}

const FunctionList = ({
  schema,
  filterString,
  isLocked,
  editFunction = noop,
  deleteFunction = noop,
}: FunctionListProps) => {
  const router = useRouter()
  const { project: selectedProject } = useProjectContext()
  const enableAssistantV2 = useIsDatabaseFunctionsAssistantEnabled()
  const { setAiAssistantPanel } = useAppStateSnapshot()

  const { data: functions } = useDatabaseFunctionsQuery({
    projectRef: selectedProject?.ref,
    connectionString: selectedProject?.connectionString,
  })

  const filteredFunctions = (functions ?? []).filter((x) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )
  const _functions = sortBy(
    filteredFunctions.filter((x) => x.schema == schema),
    (func) => func.name.toLocaleLowerCase()
  )
  const projectRef = selectedProject?.ref
  const canUpdateFunctions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'functions'
  )

  if (_functions.length === 0 && filterString.length === 0) {
    return (
      <Table.tr key={schema}>
        <Table.td colSpan={5}>
          <p className="text-sm text-foreground">No functions created yet</p>
          <p className="text-sm text-foreground-light">
            There are no functions found in the schema "{schema}"
          </p>
        </Table.td>
      </Table.tr>
    )
  }

  if (_functions.length === 0 && filterString.length > 0) {
    return (
      <Table.tr key={schema}>
        <Table.td colSpan={5}>
          <p className="text-sm text-foreground">No results found</p>
          <p className="text-sm text-foreground-light">
            Your search for "{filterString}" did not return any results
          </p>
        </Table.td>
      </Table.tr>
    )
  }

  return (
    <>
      {_functions.map((x) => {
        const isApiDocumentAvailable = schema == 'public' && x.return_type !== 'trigger'

        return (
          <Table.tr key={x.id}>
            <Table.td className="truncate">
              <p title={x.name}>{x.name}</p>
            </Table.td>
            <Table.td className="table-cell overflow-auto">
              <p title={x.argument_types} className="truncate">
                {x.argument_types || '-'}
              </p>
            </Table.td>
            <Table.td className="table-cell">
              <p title={x.return_type}>{x.return_type}</p>
            </Table.td>
            <Table.td className="table-cell">{x.security_definer ? 'Definer' : 'Invoker'}</Table.td>
            <Table.td className="text-right">
              {!isLocked && (
                <div className="flex items-center justify-end">
                  {canUpdateFunctions ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="default" className="px-1" icon={<MoreVertical />} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="left"
                        className={cn(enableAssistantV2 ? 'w-52' : 'w-40')}
                      >
                        {isApiDocumentAvailable && (
                          <DropdownMenuItem
                            className="space-x-2"
                            onClick={() => router.push(`/project/${projectRef}/api?rpc=${x.name}`)}
                          >
                            <FileText size={14} />
                            <p>Client API docs</p>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="space-x-2" onClick={() => editFunction(x)}>
                          <Edit2 size={14} />
                          <p>Edit function</p>
                        </DropdownMenuItem>
                        {enableAssistantV2 && (
                          <DropdownMenuItem
                            className="space-x-2"
                            onClick={() => {
                              setAiAssistantPanel({ open: true, editor: 'functions', entity: x })
                            }}
                          >
                            <Edit size={14} />
                            <p>Edit function with Assistant</p>
                          </DropdownMenuItem>
                        )}
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
            </Table.td>
          </Table.tr>
        )
      })}
    </>
  )
}

export default FunctionList
