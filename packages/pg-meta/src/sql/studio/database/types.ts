import { wrapWithTransaction } from '../../../query'

export const getCreateEnumeratedTypeSQL = ({
  schema,
  name,
  values,
  description,
}: {
  schema: string
  name: string
  values: string[]
  description?: string
}) => {
  const createSql = `create type "${schema}"."${name}" as enum (${values
    .map((x) => `'${x}'`)
    .join(', ')});`
  const commentSql =
    description !== undefined ? `comment on type "${schema}"."${name}" is '${description}';` : ''
  const sql = wrapWithTransaction(`${createSql} ${commentSql}`)
  return sql
}

export const getDeleteEnumeratedTypeSQL = ({ schema, name }: { schema: string; name: string }) => {
  return `drop type if exists ${schema}."${name}"`
}

export const getUpdateEnumeratedTypeSQL = ({
  schema,
  name,
  description,
  values = [],
}: {
  schema: string
  name: { original: string; updated: string }
  description?: string
  values?: { original: string; updated: string; isNew: boolean }[]
}) => {
  const statements: string[] = []
  if (name.original !== name.updated) {
    statements.push(`alter type "${schema}"."${name.original}" rename to "${name.updated}";`)
  }
  if (values.length > 0) {
    values.forEach((x, idx) => {
      if (x.isNew) {
        if (idx === 0) {
          // Consider if any new enums were added before any existing enums
          const firstExistingEnumValue = values.find((x) => !x.isNew)
          statements.push(
            `alter type "${schema}"."${name.updated}" add value '${x.updated}' before '${firstExistingEnumValue?.original}';`
          )
        } else {
          statements.push(
            `alter type "${schema}"."${name.updated}" add value '${x.updated}' after '${
              values[idx - 1].updated
            }';`
          )
        }
      } else if (x.original !== x.updated) {
        statements.push(
          `alter type "${schema}"."${name.updated}" rename value '${x.original}' to '${x.updated}';`
        )
      }
    })
  }
  if (description !== undefined) {
    statements.push(`comment on type "${schema}"."${name.updated}" is '${description}';`)
  }

  const sql = wrapWithTransaction(statements.join(' '))
  return sql
}
