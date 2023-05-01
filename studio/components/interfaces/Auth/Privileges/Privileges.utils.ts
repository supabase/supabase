import { PrivilegesData } from 'data/database/privileges-query'
import { PRIVILEGE_TYPES } from './Privileges.constants'
import { PrivilegeColumnUI, PrivilegeDataCalculation, PrivilegesDataUI } from './Privileges.types'

export function mapFromUIPrivilegesData(data: PrivilegesDataUI): PrivilegesData {
  const result: PrivilegesData = {}

  for (const column of data.columns) {
    for (const privilege of column.privileges) {
      if (!result[privilege]) result[privilege] = []

      result[privilege].push({
        name: column.name,
        isGlobal: false,
        isColumnSpecific: true,
      })
    }
  }

  return result
}

export function mapDataToPrivilegeColumnUI(
  data: PrivilegesData,
  columnNames: string[]
): PrivilegeColumnUI[] {
  const resultColumns: PrivilegeColumnUI[] = columnNames.map((name) => ({
    name,
    privileges: [],
  }))

  for (const [privilege, columns] of Object.entries(data)) {
    for (const column of columns) {
      const columnUI = resultColumns.find((c) => c.name === column.name)
      if (columnUI) {
        columnUI.privileges.push(privilege)
      } else {
        resultColumns.push({
          name: column.name,
          privileges: [privilege],
        })
      }
    }
  }

  return resultColumns
}

export function arePrivilegesEqual(a: PrivilegeColumnUI[], b: PrivilegeColumnUI[]) {
  return a.every((column) => {
    const columnB = b.find((c) => c.name === column.name)
    return (
      columnB &&
      column.privileges.every((privilege) => columnB.privileges.includes(privilege)) &&
      columnB.privileges.every((privilege) => column.privileges.includes(privilege))
    )
  })
}

export function generatePrivilegesSQLQuery(
  originalData: PrivilegesData,
  changesData: PrivilegesDataUI
): string {
  const queries: string[] = []

  const { schema, table, role } = changesData

  const changesMapped = mapCalculationPrivilegesData(changesData)

  for (const privilege in changesMapped.privilegeColumns) {
    let changes = changesMapped.privilegeColumns[privilege]
    let originalColumnsOn = originalData[privilege] ?? []

    if (
      arraysEqual(
        changes.columnsOn,
        originalColumnsOn.map((c) => c.name)
      )
    )
      continue

    if (originalColumnsOn.some((c) => c.isGlobal)) {
      queries.push(`REVOKE ${privilege} ON TABLE ${schema}.${table} FROM ${role};`)
      originalColumnsOn = originalColumnsOn.filter((c) => !(c.isGlobal && !c.isColumnSpecific))
    }

    if (changes.columnsOff.length === 0 && changes.columnsOn.length > 0) {
      queries.push(`GRANT ${privilege} ON TABLE ${schema}.${table} TO ${role};`)
      changes = {
        columnsOn: [],
        columnsOff: originalColumnsOn.map((c) => c.name),
      }
    }

    const columnsOff = changes.columnsOff.filter((c) => originalColumnsOn.some((o) => o.name === c))

    if (columnsOff.length > 0) {
      queries.unshift(
        `REVOKE ${privilege} (${columnsOff.join(', ')}) ON TABLE ${schema}.${table} FROM ${role};`
      )
    }

    const columnsOn = changes.columnsOn.filter((c) => !originalColumnsOn.some((o) => o.name === c))

    if (columnsOn.length > 0) {
      queries.push(
        `GRANT ${privilege} (${columnsOn.join(', ')}) ON TABLE ${schema}.${table} TO ${role};`
      )
    }
  }

  return queries.join('\n')
}

function mapCalculationPrivilegesData(data: PrivilegesDataUI): PrivilegeDataCalculation {
  const { columns, ...rest } = data

  const mapped: PrivilegeDataCalculation = {
    ...rest,
    privilegeColumns: {},
  }

  columns.forEach((column) => {
    PRIVILEGE_TYPES.forEach((privilege) => {
      if (!mapped.privilegeColumns[privilege]) {
        mapped.privilegeColumns[privilege] = {
          columnsOn: [],
          columnsOff: [],
        }
      }

      if (column.privileges.includes(privilege)) {
        mapped.privilegeColumns[privilege].columnsOn.push(column.name)
      } else {
        mapped.privilegeColumns[privilege].columnsOff.push(column.name)
      }
    })
  })

  return mapped
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x))
}
