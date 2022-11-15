import { FC } from 'react'
import { useRouter } from 'next/router'
import { includes } from 'lodash'
import { Button, Dropdown, IconEdit3, IconFileText, IconMoreVertical, IconTrash } from 'ui'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore } from 'hooks'
import Table from 'components/to-be-cleaned/Table'

interface Props {
  schema: string
  filterString: string
  editFunction: (fn: any) => void
  deleteFunction: (fn: any) => void
}

const FunctionList: FC<Props> = ({
  schema,
  filterString,
  editFunction = () => {},
  deleteFunction = () => {},
}) => {
  const router = useRouter()
  const { ui, meta } = useStore()
  const functions = meta.functions.list((fn: any) => !meta.excludedSchemas.includes(fn.schema))
  const filteredFunctions = functions.filter((x: any) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )
  const _functions = filteredFunctions.filter((x) => x.schema == schema)
  const isApiDocumentAvailable = schema == 'public'
  const projectRef = ui.selectedProject?.ref

  const canUpdateFunctions = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'functions')

  function onEdit(func: any) {
    editFunction(func)
  }

  function onDelete(func: any) {
    deleteFunction(func)
  }

  return (
    <>
      {_functions.map((x) => (
        <Table.tr key={x.id}>
          <Table.td>
            <p>{x.name}</p>
          </Table.td>
          <Table.td className="hidden md:table-cell md:overflow-auto">
            <p>{x.argument_types}</p>
          </Table.td>
          <Table.td className="hidden lg:table-cell">
            <p>{x.return_type}</p>
          </Table.td>
          <Table.td className="text-right">
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
                      <Dropdown.Item icon={<IconEdit3 size="tiny" />} onClick={() => onEdit(x)}>
                        Edit function
                      </Dropdown.Item>
                      <Dropdown.Item
                        icon={<IconTrash stroke="red" size="tiny" />}
                        onClick={() => onDelete(x)}
                      >
                        Delete function
                      </Dropdown.Item>
                    </>
                  }
                >
                  <Button as="span" type="default" icon={<IconMoreVertical />} />
                </Dropdown>
              ) : (
                <Tooltip.Root delayDuration={0}>
                  <Tooltip.Trigger>
                    <Button as="span" disabled type="default" icon={<IconMoreVertical />} />
                  </Tooltip.Trigger>
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
                </Tooltip.Root>
              )}
            </div>
          </Table.td>
        </Table.tr>
      ))}
    </>
  )
}

export default observer(FunctionList)
