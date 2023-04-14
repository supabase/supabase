import { PrivilegesData } from 'data/database/privileges-query'
import { PRIVILEGE_TYPES } from './Privileges.constants'

export function arePrivilegesEqual(a: PrivilegesData, b: PrivilegesData) {
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
  changesData: PrivilegesData
): string {
  const queries: string[] = []

  const originalMapped = mapPrivilegesData(originalData)
  const changesMapped = mapPrivilegesData(changesData)

  for (const schema in changesMapped) {
    for (const role in changesMapped[schema]) {
      for (const table in changesMapped[schema][role]) {
        for (const privilege in changesMapped[schema][role][table]) {
          let changes = changesMapped[schema][role][table][privilege]
          let original = originalMapped[schema][role][table][privilege]

          if (arraysEqual(changes.columnsOn, original.columnsOn)) continue

          if (!original.isColumnSpecific && original.columnsOn.length > 0) {
            queries.push(`REVOKE ${privilege} ON TABLE ${schema}.${table} FROM ${role};`)
            original = {
              ...original,
              columnsOn: [],
              columnsOff: original.columnsOn,
            }
          }

          if (changes.columnsOff.length === 0 && changes.columnsOn.length > 0) {
            queries.push(`GRANT ${privilege} ON TABLE ${schema}.${table} TO ${role};`)
            changes = {
              ...changes,
              columnsOn: [],
              columnsOff: original.columnsOn,
            }
          }

          const columnsOff = changes.columnsOff.filter((c) => original.columnsOn.includes(c))

          if (columnsOff.length > 0) {
            queries.unshift(
              `REVOKE ${privilege} (${columnsOff.join(
                ', '
              )}) ON TABLE ${schema}.${table} FROM ${role};`
            )
          }

          const columnsOn = changes.columnsOn.filter((c) => !original.columnsOn.includes(c))

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

function mapPrivilegesData(data: PrivilegesData) {
  const mapped: Record<
    string,
    Record<
      string,
      Record<
        string,
        Record<string, { columnsOn: string[]; columnsOff: string[]; isColumnSpecific: boolean }>
      >
    >
  > = {}

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
                  isColumnSpecific: data[schema][role][table].some((c) => c.isColumnSpecific),
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
