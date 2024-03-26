import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  ColumnPrivilegesGrant,
  grantColumnPrivileges,
} from 'data/privileges/column-privileges-grant-mutation'
import type { ColumnPrivilege } from 'data/privileges/column-privileges-query'
import {
  ColumnPrivilegesRevoke,
  revokeColumnPrivileges,
} from 'data/privileges/column-privileges-revoke-mutation'
import {
  TablePrivilegesGrant,
  grantTablePrivileges,
} from 'data/privileges/table-privileges-grant-mutation'
import type { TablePrivilege } from 'data/privileges/table-privileges-query'
import {
  TablePrivilegesRevoke,
  revokeTablePrivileges,
} from 'data/privileges/table-privileges-revoke-mutation'
import {
  ALL_PRIVILEGE_TYPES,
  COLUMN_PRIVILEGE_TYPES,
  ColumnPrivilegeType,
} from './Privileges.constants'
import { privilegeKeys } from 'data/privileges/keys'

export interface PrivilegeOperation {
  object: 'table' | 'column'
  type: 'grant' | 'revoke'
  id: string | number
  grantee: string
  privilege_type: string
}

export function getDefaultTableCheckedStates(tablePrivilege: TablePrivilege) {
  return Object.fromEntries(
    ALL_PRIVILEGE_TYPES.map((privilege) => [
      privilege,
      tablePrivilege.privileges.find((p) => p.privilege_type === privilege) !== undefined,
    ])
  )
}

export function getDefaultColumnCheckedStates(columnPrivileges: ColumnPrivilege[]) {
  return Object.fromEntries(
    columnPrivileges.map((column) => [
      column.column_id,
      Object.fromEntries(
        COLUMN_PRIVILEGE_TYPES.map((privilege) => [
          privilege,
          column.privileges.find((p) => p.privilege_type === privilege) !== undefined,
        ])
      ),
    ])
  )
}

interface UsePrivilegesStateOptions {
  tableId: number
  role: string
  defaultTableCheckedStates: ReturnType<typeof getDefaultTableCheckedStates>
  defaultColumnCheckedStates: ReturnType<typeof getDefaultColumnCheckedStates>
}

function addOrRemoveOperation(
  operations: PrivilegeOperation[],
  operation: PrivilegeOperation,
  /** removes old operations and always adds the new one */
  forceAdd = false
): PrivilegeOperation[] {
  let state = [...operations]

  const oppositeType = operation.type === 'grant' ? 'revoke' : 'grant'

  const existing = state.find((op) => {
    return (
      op.object === operation.object &&
      op.type === oppositeType &&
      op.id === operation.id &&
      op.grantee === operation.grantee &&
      op.privilege_type === operation.privilege_type
    )
  })

  if (existing !== undefined) {
    state = state.filter((op) => op !== existing)

    if (!forceAdd) {
      return state
    }
  }

  state.push(operation)

  return state
}

export function usePrivilegesState({
  defaultTableCheckedStates,
  defaultColumnCheckedStates,
  tableId,
  role,
}: UsePrivilegesStateOptions) {
  const [operations, setOperations] = useState<PrivilegeOperation[]>([])

  const tableCheckedStates = operations.reduce((acc, op) => {
    if (op.object === 'table' && op.id === tableId && op.grantee === role) {
      return {
        ...acc,
        [op.privilege_type]: op.type === 'grant',
      }
    }

    return acc
  }, defaultTableCheckedStates)

  const columnCheckedStates = operations.reduce((acc, op) => {
    let curr = acc

    if (op.object === 'table' && op.grantee === role) {
      curr = Object.fromEntries(
        Object.entries(curr).map(([id, column]) => [
          id,
          Object.fromEntries(
            Object.entries(column).map(([privilege, value]) => [
              privilege,
              op.privilege_type === privilege ? op.type === 'grant' : value,
            ])
          ),
        ])
      )
    }

    if (op.object === 'column' && op.grantee === role) {
      return {
        ...curr,
        [op.id]: {
          ...curr[op.id],
          [op.privilege_type]: op.type === 'grant',
        },
      }
    }

    return curr
  }, defaultColumnCheckedStates)

  function toggleTablePrivilege(privilegeType: string) {
    const shouldGrant = !tableCheckedStates[privilegeType]

    setOperations((prevState) => {
      let state = [...prevState]

      if (COLUMN_PRIVILEGE_TYPES.includes(privilegeType as ColumnPrivilegeType)) {
        if (shouldGrant) {
          // remove all operations for the columns since
          // the table privilege will take precedence
          state = state.filter(
            (op) =>
              !(
                op.object === 'column' &&
                op.grantee === role &&
                op.privilege_type === privilegeType
              )
          )
        }
      }

      state = addOrRemoveOperation(state, {
        object: 'table',
        type: shouldGrant ? 'grant' : 'revoke',
        id: tableId,
        grantee: role,
        privilege_type: privilegeType,
      })

      return state
    })
  }

  function toggleColumnPrivilege(columnId: string, privilegeType: string) {
    const shouldGrant = !columnCheckedStates[columnId][privilegeType]

    setOperations((prevState) => {
      let state = [...prevState]

      // if the user is revoking a column and the table is enabled
      if (!shouldGrant && tableCheckedStates[privilegeType]) {
        // also revoke the table privilege
        state = addOrRemoveOperation(state, {
          object: 'table',
          type: 'revoke',
          id: tableId,
          grantee: role,
          privilege_type: privilegeType,
        })

        // grant all other enabled columns
        const operations = Object.entries(columnCheckedStates)
          .filter(([id]) => id !== columnId)
          .map(([id, column]) => ({
            object: 'column' as const,
            type: column[privilegeType] ? ('grant' as const) : ('revoke' as const),
            id,
            grantee: role,
            privilege_type: privilegeType,
          }))
        operations.forEach((op) => {
          state = addOrRemoveOperation(state, op)
        })
      }

      if (shouldGrant) {
        const areAllOtherColumnsEnabled = Object.entries(columnCheckedStates).every(
          ([id, column]) => id === columnId || column[privilegeType]
        )

        if (areAllOtherColumnsEnabled) {
          // remove all operations for the columns since
          // the table privilege will take precedence
          state = state.filter(
            (op) =>
              !(
                op.object === 'column' &&
                op.grantee === role &&
                op.privilege_type === privilegeType
              )
          )

          // grant the table privilege
          state = addOrRemoveOperation(state, {
            object: 'table',
            type: 'grant',
            id: tableId,
            grantee: role,
            privilege_type: privilegeType,
          })

          return state
        }
      }

      state = addOrRemoveOperation(state, {
        object: 'column',
        type: shouldGrant ? 'grant' : 'revoke',
        id: columnId,
        grantee: role,
        privilege_type: privilegeType,
      })

      return state
    })
  }

  const resetOperations = useCallback(() => {
    setOperations([])
  }, [])

  return {
    tableCheckedStates,
    columnCheckedStates,
    operations,
    toggleTablePrivilege,
    toggleColumnPrivilege,
    resetOperations,
  }
}

export function useApplyPrivilegeOperations(callback?: () => void) {
  const { project } = useProjectContext()
  const queryClient = useQueryClient()

  const [isLoading, setIsLoading] = useState(false)

  const apply = useCallback(
    async (operations: PrivilegeOperation[]) => {
      if (!project) return console.error('No project selected')

      setIsLoading(true)

      const tableOperations = operations.filter((op) => op.object === 'table')
      const columnOperations = operations.filter((op) => op.object === 'column')

      const grantTableOperations = tableOperations
        .filter((op) => op.type === 'grant')
        .map((op) => ({
          relation_id: Number(op.id),
          grantee: op.grantee,
          privilege_type: op.privilege_type as TablePrivilegesGrant['privilege_type'],
        }))
      const revokeTableOperations = tableOperations
        .filter((op) => op.type === 'revoke')
        .map((op) => ({
          relation_id: Number(op.id),
          grantee: op.grantee,
          privilege_type: op.privilege_type as TablePrivilegesRevoke['privilege_type'],
        }))

      const grantColumnOperations = columnOperations
        .filter((op) => op.type === 'grant')
        .map((op) => ({
          column_id: String(op.id),
          grantee: op.grantee,
          privilege_type: op.privilege_type as ColumnPrivilegesGrant['privilege_type'],
        }))
      const revokeColumnOperations = columnOperations
        .filter((op) => op.type === 'revoke')
        .map((op) => ({
          column_id: String(op.id),
          grantee: op.grantee,
          privilege_type: op.privilege_type as ColumnPrivilegesRevoke['privilege_type'],
        }))

      // annoyingly these can't be run all at once
      // as postgres can't process them in parallel

      if (revokeTableOperations.length > 0) {
        await revokeTablePrivileges({
          projectRef: project.ref,
          connectionString: project.connectionString,
          revokes: revokeTableOperations,
        })
      }
      if (grantTableOperations.length > 0) {
        await grantTablePrivileges({
          projectRef: project.ref,
          connectionString: project.connectionString,
          grants: grantTableOperations,
        })
      }
      if (revokeColumnOperations.length > 0) {
        await revokeColumnPrivileges({
          projectRef: project.ref,
          connectionString: project.connectionString,
          revokes: revokeColumnOperations,
        })
      }
      if (grantColumnOperations.length > 0) {
        await grantColumnPrivileges({
          projectRef: project.ref,
          connectionString: project.connectionString,
          grants: grantColumnOperations,
        })
      }

      await Promise.all([
        queryClient.invalidateQueries(privilegeKeys.tablePrivilegesList(project.ref)),
        queryClient.invalidateQueries(privilegeKeys.columnPrivilegesList(project.ref)),
      ])

      setIsLoading(false)

      callback?.()
    },
    [callback, project, queryClient]
  )

  return { apply, isLoading }
}
