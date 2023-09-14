import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes, noop } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { Button, Dropdown, IconEdit3, IconFileText, IconMoreVertical, IconTrash } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import { useCheckPermissions, useStore } from 'hooks'

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
  const { meta } = useStore()
  const { project: selectedProject } = useProjectContext()

  const functions = meta.functions.list()
  const filteredFunctions = functions.filter((x: any) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )
  const _functions = filteredFunctions.filter((x) => x.schema == schema)
  const isApiDocumentAvailable = schema == 'public'
  const projectRef = selectedProject?.ref

  const canUpdateFunctions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'functions'
  )

  if (_functions.length === 0 && filterString.length === 0) {
    return (
      <Table.tr key={schema}>
        <Table.td colSpan={4}>
          <p className="text-sm text-scale-1200">No functions created yet</p>
          <p className="text-sm text-light">
            There are no functions found in the schema "{schema}"
          </p>
        </Table.td>
      </Table.tr>
    )
  }

  if (_functions.length === 0 && filterString.length > 0) {
    return (
      <Table.tr key={schema}>
        <Table.td colSpan={4}>
          <p className="text-sm text-scale-1200">No results found</p>
          <p className="text-sm text-light">
            Your search for "{filterString}" did not return any results
          </p>
        </Table.td>
      </Table.tr>
    )
  }

  return (
    <>
      {_functions.map((x) => (
        <Table.tr key={x.id}>
          <Table.td className="truncate">
            <p>{x.name}</p>
          </Table.td>
          <Table.td className="hidden md:table-cell md:overflow-auto">
            <p>{x.argument_types}</p>
          </Table.td>
          <Table.td className="hidden lg:table-cell">
            <p>{x.return_type}</p>
          </Table.td>
          <Table.td className="text-right">
            {!isLocked && (
              <div className="flex items-center justify-end">
                {canUpdateFunctions ? (
                  <Dropdown
                    side="left"
                    overlay={
                      <>
                        {isApiDocumentAvailable && (
                          <Dropdown.Item
                            icon={<IconFileText size="tiny" />}
                            onClick={() => router.push(`/project/${projectRef}/api?rpc=${x.name}`)}
                          >
                            Client API docs
                          </Dropdown.Item>
                        )}
                        <Dropdown.Item
                          icon={<IconEdit3 size="tiny" />}
                          onClick={() => editFunction(x)}
                        >
                          Edit function
                        </Dropdown.Item>
                        <Dropdown.Item
                          icon={<IconTrash stroke="red" size="tiny" />}
                          onClick={() => deleteFunction(x)}
                        >
                          Delete function
                        </Dropdown.Item>
                      </>
                    }
                  >
                    <Button asChild type="default" icon={<IconMoreVertical />}>
                      <span></span>
                    </Button>
                  </Dropdown>
                ) : (
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger asChild>
                      <Button disabled type="default" icon={<IconMoreVertical />} />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content side="left">
                        <Tooltip.Arrow className="radix-tooltip-arrow" />
                        <div
                          className={[
                            'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                            'border border-scale-200',
                          ].join(' ')}
                        >
                          <span className="text-xs text-scale-1200">
                            You need additional permissions to update functions
                          </span>
                        </div>
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                )}
              </div>
            )}
          </Table.td>
        </Table.tr>
      ))}
    </>
  )
}

export default observer(FunctionList)
