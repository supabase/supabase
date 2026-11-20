import {
  Card,
  Label,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

import {
  ALL_PRIVILEGE_TYPES,
  COLUMN_PRIVILEGE_TYPES,
  TABLE_PRIVILEGE_TYPES,
} from './Privileges.constants'
import { usePrivilegesState } from './Privileges.utils'
import type { ColumnPrivilege } from '@/data/privileges/column-privileges-query'

export interface PrivilegesTableProps extends Pick<
  ReturnType<typeof usePrivilegesState>,
  'tableCheckedStates' | 'columnCheckedStates' | 'toggleTablePrivilege' | 'toggleColumnPrivilege'
> {
  columnPrivileges: ColumnPrivilege[]
  disabled: boolean
  isApplyingChanges?: boolean
}

export const PrivilegesTable = ({
  columnPrivileges,
  tableCheckedStates,
  columnCheckedStates,
  toggleTablePrivilege,
  toggleColumnPrivilege,
  disabled,
  isApplyingChanges = false,
}: PrivilegesTableProps) => {
  const handleClickColumnName = (columnId: string) => {
    const hasAllPrivileges = COLUMN_PRIVILEGE_TYPES.every(
      (privilege) => columnCheckedStates[columnId][privilege]
    )
    const privilegesToToggle = COLUMN_PRIVILEGE_TYPES.filter((privilege) =>
      hasAllPrivileges
        ? columnCheckedStates[columnId][privilege]
        : !columnCheckedStates[columnId][privilege]
    )

    privilegesToToggle.forEach((privilege) => {
      toggleColumnPrivilege(columnId, privilege)
    })
  }

  return (
    <Card className="mb-4">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead key="header-column">
              <span>Column</span>
            </TableHead>
            {ALL_PRIVILEGE_TYPES.map((privilege) => {
              const checked = tableCheckedStates[privilege]
              const switchThId = `privilege-th-${privilege}`

              return (
                <TableHead key={`header-${privilege}`}>
                  <div className="inline-flex items-center gap-2">
                    <Label htmlFor={switchThId} className="text-xs">
                      {privilege.charAt(0) + privilege.slice(1).toLowerCase()}
                    </Label>

                    <Switch
                      id={switchThId}
                      checked={checked}
                      onCheckedChange={() => {
                        toggleTablePrivilege(privilege)
                      }}
                      disabled={disabled || isApplyingChanges}
                    />
                  </div>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {columnPrivileges.map((column) => (
            <TableRow key={column.column_id}>
              <TableCell>
                <button
                  tabIndex={0}
                  onClick={() => handleClickColumnName(column.column_id)}
                  className="block w-full truncate text-left text-foreground"
                >
                  {column.column_name}
                </button>
              </TableCell>
              {COLUMN_PRIVILEGE_TYPES.map((privilege) => {
                const checked = columnCheckedStates[column.column_id][privilege]

                return (
                  <TableCell key={privilege}>
                    {COLUMN_PRIVILEGE_TYPES.includes(privilege) && (
                      <div className="ml-5 inline-flex">
                        <Switch
                          aria-label={`${privilege} privilege for ${column.column_name}`}
                          checked={checked}
                          onCheckedChange={() => {
                            toggleColumnPrivilege(column.column_id, privilege)
                          }}
                          disabled={disabled || isApplyingChanges}
                        />
                      </div>
                    )}
                  </TableCell>
                )
              })}
              {TABLE_PRIVILEGE_TYPES.map((privilege) => {
                return (
                  <TableCell key={privilege}>
                    <span className="ml-5 text-xs text-foreground-lighter">N/A</span>
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
