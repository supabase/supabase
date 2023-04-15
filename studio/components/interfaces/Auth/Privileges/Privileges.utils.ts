import { PrivilegesData } from 'data/database/privileges-query'
import { PRIVILEGE_TYPES } from './Privileges.constants'
import { PrivilegeDataCalculation, PrivilegesDataUI } from './Privileges.types'

export function mapFromUIPrivilegesData(data: PrivilegesDataUI): PrivilegesData {
  const result: PrivilegesData = {}

  for (const schema in data) {
    result[schema] = {}

    for (const role in data[schema]) {
      result[schema][role] = {}

      for (const table in data[schema][role]) {
        result[schema][role][table] = {}

        for (const privilege of PRIVILEGE_TYPES) {
          result[schema][role][table][privilege] = []
        }

        for (const column of data[schema][role][table]) {
          for (const privilege of column.privileges) {
            result[schema][role][table][privilege].push({
              name: column.name,
              isGlobal: false,
              isColumnSpecific: true,
            })
          }
        }
      }
    }
  }

  return result
}

export function mapToUIPrivilegesData(data: PrivilegesData): PrivilegesDataUI {
  const result: PrivilegesDataUI = {}

  for (const schema in data) {
    result[schema] = {}

    for (const role in data[schema]) {
      result[schema][role] = {}

      for (const table in data[schema][role]) {
        result[schema][role][table] = []

        for (const [privilege, columns] of Object.entries(data[schema][role][table])) {
          for (const column of columns) {
            const columnUI = result[schema][role][table].find((c) => c.name === column.name)
            if (columnUI) {
              columnUI.privileges.push(privilege)
            } else {
              result[schema][role][table].push({
                name: column.name,
                privileges: [privilege],
              })
            }
          }
        }
      }
    }
  }

  return result
}

export function arePrivilegesEqual(a: PrivilegesDataUI, b: PrivilegesDataUI) {
  return Object.keys(a).every((schema) => {
    return Object.keys(a[schema]).every((role) => {
      return Object.keys(a[schema][role]).every((table) => {
        return a[schema][role][table].every((column) => {
          const columnB = b[schema][role][table].find((c) => c.name === column.name)
          if (!columnB) return false
          return (
            column.privileges.every((privilege) => columnB.privileges.includes(privilege)) &&
            columnB.privileges.every((privilege) => column.privileges.includes(privilege))
          )
        })
      })
    })
  })
}

export function generatePrivilegesSQLQuery(
  originalData: PrivilegesData,
  changesData: PrivilegesDataUI
): string {
  const queries: string[] = []

  const changesMapped = mapCalculationPrivilegesData(changesData)

  for (const schema in changesMapped) {
    for (const role in changesMapped[schema]) {
      for (const table in changesMapped[schema][role]) {
        for (const privilege in changesMapped[schema][role][table]) {
          let changes = changesMapped[schema][role][table][privilege]
          let originalColumnsOn = originalData[schema][role][table][privilege] ?? []

          if (
            arraysEqual(
              changes.columnsOn,
              originalColumnsOn.map((c) => c.name)
            )
          )
            continue

          if (originalColumnsOn.some((c) => c.isGlobal)) {
            queries.push(`REVOKE ${privilege} ON TABLE ${schema}.${table} FROM ${role};`)
            originalColumnsOn = originalColumnsOn.filter(
              (c) => !(c.isGlobal && !c.isColumnSpecific)
            )
          }

          if (changes.columnsOff.length === 0 && changes.columnsOn.length > 0) {
            queries.push(`GRANT ${privilege} ON TABLE ${schema}.${table} TO ${role};`)
            changes = {
              columnsOn: [],
              columnsOff: originalColumnsOn.map((c) => c.name),
            }
          }

          const columnsOff = changes.columnsOff.filter((c) =>
            originalColumnsOn.some((o) => o.name === c)
          )

          if (columnsOff.length > 0) {
            queries.unshift(
              `REVOKE ${privilege} (${columnsOff.join(
                ', '
              )}) ON TABLE ${schema}.${table} FROM ${role};`
            )
          }

          const columnsOn = changes.columnsOn.filter(
            (c) => !originalColumnsOn.some((o) => o.name === c)
          )

          if (columnsOn.length > 0) {
            queries.push(
              `GRANT ${privilege} (${columnsOn.join(', ')}) ON TABLE ${schema}.${table} TO ${role};`
            )
          }
        }
      }
    }
  }

  return queries.join('\n')
}

function mapCalculationPrivilegesData(data: PrivilegesDataUI): PrivilegeDataCalculation {
  const mapped: PrivilegeDataCalculation = {}

  Object.keys(data).forEach((schema) => {
    Object.keys(data[schema]).forEach((role) => {
      Object.keys(data[schema][role]).forEach((table) => {
        data[schema][role][table].forEach((column) => {
          if (!mapped[schema]) mapped[schema] = {}
          if (!mapped[schema][role]) mapped[schema][role] = {}
          if (!mapped[schema][role][table])
            mapped[schema][role][table] = Object.fromEntries(
              PRIVILEGE_TYPES.map((privilege) => [
                privilege,
                {
                  columnsOn: [],
                  columnsOff: [],
                },
              ])
            )

          PRIVILEGE_TYPES.forEach((privilege) => {
            if (column.privileges.includes(privilege)) {
              mapped[schema][role][table][privilege].columnsOn.push(column.name)
            } else {
              mapped[schema][role][table][privilege].columnsOff.push(column.name)
            }
          })
        })
      })
    })
  })

  return mapped
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x))
}
