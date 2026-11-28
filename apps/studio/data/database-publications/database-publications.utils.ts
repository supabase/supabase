import type { PGPublication } from '@supabase/pg-meta'

type TableIdentity = {
  id: number
  schema: string
  name: string
}

type PublicationTable = NonNullable<PGPublication['tables']>[number]

export const isTableInPublication = (
  publication: Pick<PGPublication, 'tables'> | undefined,
  tableId: number | undefined
) =>
  tableId !== undefined &&
  publication !== undefined &&
  (publication.tables === null || publication.tables.some((table) => table.id === tableId))

const toQualifiedName = ({ schema, name }: Pick<TableIdentity, 'schema' | 'name'>) =>
  `${schema}.${name}`

export const getTablesForPublicationToggle = ({
  publication,
  table,
  enabled,
  allTables,
}: {
  publication: Pick<PGPublication, 'tables'>
  table: TableIdentity
  enabled: boolean
  allTables?: TableIdentity[]
}): string[] | undefined => {
  const isEnabled = isTableInPublication(publication, table.id)
  if (isEnabled === enabled) return undefined

  if (publication.tables === null && allTables === undefined) {
    throw new Error('allTables is required when updating an all-tables publication')
  }

  const currentTables: PublicationTable[] | TableIdentity[] = publication.tables ?? allTables ?? []
  const nextTables = enabled
    ? [...currentTables, table]
    : currentTables.filter((candidate) => candidate.id !== table.id)

  return nextTables.map(toQualifiedName)
}
