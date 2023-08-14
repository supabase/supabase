import * as Tooltip from '@radix-ui/react-tooltip'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import ConditionalWrap from 'components/ui/ConditionalWrap'
import { useColumnPrivilegesGrantMutation } from 'data/privileges/column-privileges-grant-mutation'
import { useColumnPrivilegesRevokeMutation } from 'data/privileges/column-privileges-revoke-mutation'
import { useTablePrivilegesGrantMutation } from 'data/privileges/table-privileges-grant-mutation'
import { useTablePrivilegesRevokeMutation } from 'data/privileges/table-privileges-revoke-mutation'
import { useState } from 'react'
import { IconLoader, Toggle } from 'ui'
import {
  COLUMN_PRIVILEGE_TYPES,
  ColumnPrivilegeType,
  TABLE_PRIVILEGE_TYPES,
  TablePrivilegeType,
} from './Privileges.constants'
import { PrivilegeColumnUI, TablePrivilegesUI } from './Privileges.types'
import { getPrivilegesLoadingKey, isPrivilegesLoading } from './Privileges.utils'

export interface PrivilegesTableProps {
  tableId: number
  tablePrivileges: TablePrivilegesUI[]
  columns: PrivilegeColumnUI[]
  role: string
}

const PrivilegesTable = ({ tableId, tablePrivileges, columns, role }: PrivilegesTableProps) => {
  const { project } = useProjectContext()

  const [loadingStates, setLoadingStates] = useState<Set<string>>(() => new Set())

  const { mutate: grantTable } = useTablePrivilegesGrantMutation({
    onMutate(variables) {
      setLoadingStates((prev) => {
        const newSet = new Set(prev)

        variables.grants.forEach((grant) => {
          newSet.add(getPrivilegesLoadingKey('table', grant))
        })

        return newSet
      })
    },
    onSettled(_data, _error, variables) {
      setLoadingStates((prev) => {
        const newSet = new Set(prev)

        variables.grants.forEach((grant) => {
          newSet.delete(getPrivilegesLoadingKey('table', grant))
        })

        return newSet
      })
    },
  })
  const { mutate: revokeTable } = useTablePrivilegesRevokeMutation({
    onMutate(variables) {
      setLoadingStates((prev) => {
        const newSet = new Set(prev)

        variables.revokes.forEach((revoke) => {
          newSet.add(getPrivilegesLoadingKey('table', revoke))
        })

        return newSet
      })
    },
    onSettled(_data, _error, variables) {
      setLoadingStates((prev) => {
        const newSet = new Set(prev)

        variables.revokes.forEach((revoke) => {
          newSet.delete(getPrivilegesLoadingKey('table', revoke))
        })

        return newSet
      })
    },
  })

  const onToggleTable = (privileges: readonly TablePrivilegeType[], shouldGrant = true) => {
    if (!project) return console.error('No project found')

    if (shouldGrant) {
      grantTable({
        projectRef: project.ref,
        connectionString: project.connectionString,
        grants: privileges.map((privilege) => ({
          relation_id: tableId,
          grantee: role,
          privilege_type: privilege,
        })),
      })
    } else {
      revokeTable({
        projectRef: project.ref,
        connectionString: project.connectionString,
        revokes: privileges.map((privilege) => ({
          relation_id: tableId,
          grantee: role,
          privilege_type: privilege,
        })),
      })
    }
  }

  const { mutate: grantColumn } = useColumnPrivilegesGrantMutation({
    onMutate(variables) {
      setLoadingStates((prev) => {
        const newSet = new Set(prev)

        variables.grants.forEach((grant) => {
          newSet.add(getPrivilegesLoadingKey('column', grant))
        })

        return newSet
      })
    },
    onSettled(_data, _error, variables) {
      setLoadingStates((prev) => {
        const newSet = new Set(prev)

        variables.grants.forEach((grant) => {
          newSet.delete(getPrivilegesLoadingKey('column', grant))
        })

        return newSet
      })
    },
  })
  const { mutate: revokeColumn } = useColumnPrivilegesRevokeMutation({
    onMutate(variables) {
      setLoadingStates((prev) => {
        const newSet = new Set(prev)

        variables.revokes.forEach((revoke) => {
          newSet.add(getPrivilegesLoadingKey('column', revoke))
        })

        return newSet
      })
    },
    onSettled(_data, _error, variables) {
      setLoadingStates((prev) => {
        const newSet = new Set(prev)

        variables.revokes.forEach((revoke) => {
          newSet.delete(getPrivilegesLoadingKey('column', revoke))
        })

        return newSet
      })
    },
  })

  const onToggleColumn = (
    column: PrivilegeColumnUI,
    privileges: readonly ColumnPrivilegeType[],
    shouldGrant = true
  ) => {
    if (!project) return console.error('No project found')

    if (shouldGrant) {
      grantColumn({
        projectRef: project.ref,
        connectionString: project.connectionString,
        grants: privileges.map((privilege) => ({
          column_id: column.id,
          grantee: role,
          privilege_type: privilege,
        })),
      })
    } else {
      revokeColumn({
        projectRef: project.ref,
        connectionString: project.connectionString,
        revokes: privileges.map((privilege) => ({
          column_id: column.id,
          grantee: role,
          privilege_type: privilege,
        })),
      })
    }
  }

  const handleClickPrivilege = (privilege: ColumnPrivilegeType) => {
    const allColumnsHavePrivilege = columns.every((column) => column.privileges.includes(privilege))

    columns.forEach((column) => {
      if (allColumnsHavePrivilege) {
        onToggleColumn(column, [privilege], false)
      } else if (!column.privileges.includes(privilege)) {
        onToggleColumn(column, [privilege], true)
      }
    })
  }

  const handleClickColumnName = (column: PrivilegeColumnUI) => {
    const hasAllPrivileges = COLUMN_PRIVILEGE_TYPES.every((privilege) =>
      column.privileges.includes(privilege)
    )

    if (hasAllPrivileges) {
      onToggleColumn(column, COLUMN_PRIVILEGE_TYPES, false)
    } else {
      onToggleColumn(
        column,
        COLUMN_PRIVILEGE_TYPES.filter((privilege) => !column.privileges.includes(privilege)),
        true
      )
    }
  }

  return (
    <Table
      className="table-fixed mb-4"
      head={[
        <Table.th key="header-column"></Table.th>,
        ...TABLE_PRIVILEGE_TYPES.map((privilege) => {
          const checked = tablePrivileges.find((p) => p.privilege_type === privilege) !== undefined
          const isLoading = isPrivilegesLoading(loadingStates, 'table', {
            relation_id: tableId,
            grantee: role,
            privilege_type: privilege,
          })

          return (
            <Table.th key={`header-${privilege}`}>
              <div className="inline-flex items-baseline gap-2 relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center w-full h-full bg-scale-300 z-10">
                    <IconLoader className="animate-spin" size={16} />
                  </div>
                )}

                <PrivilegeButton
                  privilege={privilege}
                  onClick={() => {
                    if (COLUMN_PRIVILEGE_TYPES.includes(privilege as any)) {
                      handleClickPrivilege(privilege as ColumnPrivilegeType)
                    }
                  }}
                  disabled={isLoading}
                />

                <Toggle
                  checked={checked}
                  onChange={() => onToggleTable([privilege], !checked)}
                  size="tiny"
                  disabled={isLoading}
                />
              </div>
            </Table.th>
          )
        }),
      ]}
      body={columns.map((column) => (
        <Table.tr key={column.name}>
          <Table.td>
            <button onClick={() => handleClickColumnName(column)}>{column.name}</button>
          </Table.td>
          {TABLE_PRIVILEGE_TYPES.map((privilege) => {
            const checked = column.privileges.includes(privilege)
            const isLoading = isPrivilegesLoading(loadingStates, 'column', {
              column_id: column.id,
              grantee: role,
              privilege_type: privilege as ColumnPrivilegeType,
            })
            const disabledDueToParent =
              tablePrivileges.find((p) => p.privilege_type === privilege) !== undefined
            const disabled = isLoading || disabledDueToParent

            return (
              <Table.td key={privilege}>
                {COLUMN_PRIVILEGE_TYPES.includes(privilege as any) && (
                  <div className="inline-flex relative">
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center w-full h-full bg-scale-200 z-10">
                        <IconLoader className="animate-spin" size={14} />
                      </div>
                    )}

                    <ConditionalWrap
                      condition={disabledDueToParent}
                      wrap={(children) => (
                        <Tooltip.Root delayDuration={0}>
                          <Tooltip.Trigger>{children}</Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content side="bottom">
                              <Tooltip.Arrow className="radix-tooltip-arrow" />
                              <div
                                className={[
                                  'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                  'border border-scale-200',
                                ].join(' ')}
                              >
                                <span className="text-xs text-scale-1200">
                                  Table privileges must be revoked first
                                </span>
                              </div>
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      )}
                    >
                      <Toggle
                        checked={checked}
                        onChange={() =>
                          onToggleColumn(column, [privilege as ColumnPrivilegeType], !checked)
                        }
                        disabled={disabled}
                        size="tiny"
                      />
                    </ConditionalWrap>
                  </div>
                )}
              </Table.td>
            )
          })}
        </Table.tr>
      ))}
    />
  )
}

const PrivilegeButton = ({
  privilege,
  onClick,
  disabled,
}: {
  privilege: string
  onClick: () => void
  disabled?: boolean
}) => {
  const formatted = privilege.charAt(0) + privilege.slice(1).toLowerCase()

  return (
    <button onClick={onClick} disabled={disabled}>
      {formatted}
    </button>
  )
}

export default PrivilegesTable
