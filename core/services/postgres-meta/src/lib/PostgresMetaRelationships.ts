import { DEFAULT_SYSTEM_SCHEMAS } from './constants.js'
import { filterByList } from './helpers.js'
import type { PostgresMetaResult, PostgresRelationship } from './types.js'
import { TABLE_RELATIONSHIPS_SQL } from './sql/table_relationships.sql.js'
import { VIEWS_KEY_DEPENDENCIES_SQL } from './sql/views_key_dependencies.sql.js'

/*
 * Only used for generating types at the moment. Will need some cleanups before
 * using it for other things, e.g. /relationships endpoint.
 */
export default class PostgresMetaRelationships {
  query: (sql: string) => Promise<PostgresMetaResult<unknown>>

  constructor(query: (sql: string) => Promise<PostgresMetaResult<unknown>>) {
    this.query = query
  }

  async list({
    includeSystemSchemas = false,
    includedSchemas,
    excludedSchemas,
  }: {
    includeSystemSchemas?: boolean
    includedSchemas?: string[]
    excludedSchemas?: string[]
  } = {}): Promise<PostgresMetaResult<PostgresRelationship[]>> {
    const schemaFilter = filterByList(
      includedSchemas,
      excludedSchemas,
      !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
    )
    let allTableM2oAndO2oRelationships: PostgresRelationship[]
    {
      const sql = TABLE_RELATIONSHIPS_SQL({ schemaFilter })
      const { data, error } = (await this.query(sql)) as PostgresMetaResult<PostgresRelationship[]>
      if (error) {
        return { data: null, error }
      }
      allTableM2oAndO2oRelationships = data
    }

    /*
     * Adapted from:
     * https://github.com/PostgREST/postgrest/blob/f9f0f79fa914ac00c11fbf7f4c558e14821e67e2/src/PostgREST/SchemaCache.hs#L392
     */
    let allViewM2oAndO2oRelationships: PostgresRelationship[]
    {
      type ColDep = {
        table_column: string
        view_columns: string[]
      }
      type KeyDep = {
        table_schema: string
        table_name: string
        view_schema: string
        view_name: string
        constraint_name: string
        constraint_type: 'f' | 'f_ref' | 'p' | 'p_ref'
        column_dependencies: ColDep[]
      }

      const viewsKeyDependenciesSql = VIEWS_KEY_DEPENDENCIES_SQL({ schemaFilter })
      const { data: viewsKeyDependencies, error } = (await this.query(
        viewsKeyDependenciesSql
      )) as PostgresMetaResult<KeyDep[]>
      if (error) {
        return { data: null, error }
      }

      const viewRelationships = allTableM2oAndO2oRelationships.flatMap((r) => {
        const expandKeyDepCols = (
          colDeps: ColDep[]
        ): { tableColumns: string[]; viewColumns: string[] }[] => {
          const tableColumns = colDeps.map(({ table_column }) => table_column)
          // https://gist.github.com/ssippe/1f92625532eef28be6974f898efb23ef?permalink_comment_id=3474581#gistcomment-3474581
          const cartesianProduct = <T>(allEntries: T[][]): T[][] => {
            return allEntries.reduce<T[][]>(
              (results, entries) =>
                results
                  .map((result) => entries.map((entry) => result.concat(entry)))
                  .reduce((subResults, result) => subResults.concat(result), []),
              [[]]
            )
          }
          const viewColumnsPermutations = cartesianProduct(colDeps.map((cd) => cd.view_columns))
          return viewColumnsPermutations.map((viewColumns) => ({ tableColumns, viewColumns }))
        }

        const viewToTableKeyDeps = viewsKeyDependencies.filter(
          (vkd) =>
            vkd.table_schema === r.schema &&
            vkd.table_name === r.relation &&
            vkd.constraint_name === r.foreign_key_name &&
            vkd.constraint_type === 'f'
        )
        const tableToViewKeyDeps = viewsKeyDependencies.filter(
          (vkd) =>
            vkd.table_schema === r.referenced_schema &&
            vkd.table_name === r.referenced_relation &&
            vkd.constraint_name === r.foreign_key_name &&
            vkd.constraint_type === 'f_ref'
        )

        const viewToTableRelationships = viewToTableKeyDeps.flatMap((vtkd) =>
          expandKeyDepCols(vtkd.column_dependencies).map(({ viewColumns }) => ({
            foreign_key_name: r.foreign_key_name,
            schema: vtkd.view_schema,
            relation: vtkd.view_name,
            columns: viewColumns,
            is_one_to_one: r.is_one_to_one,
            referenced_schema: r.referenced_schema,
            referenced_relation: r.referenced_relation,
            referenced_columns: r.referenced_columns,
          }))
        )

        const tableToViewRelationships = tableToViewKeyDeps.flatMap((tvkd) =>
          expandKeyDepCols(tvkd.column_dependencies).map(({ viewColumns }) => ({
            foreign_key_name: r.foreign_key_name,
            schema: r.schema,
            relation: r.relation,
            columns: r.columns,
            is_one_to_one: r.is_one_to_one,
            referenced_schema: tvkd.view_schema,
            referenced_relation: tvkd.view_name,
            referenced_columns: viewColumns,
          }))
        )

        const viewToViewRelationships = viewToTableKeyDeps.flatMap((vtkd) =>
          expandKeyDepCols(vtkd.column_dependencies).flatMap(({ viewColumns }) =>
            tableToViewKeyDeps.flatMap((tvkd) =>
              expandKeyDepCols(tvkd.column_dependencies).map(
                ({ viewColumns: referencedViewColumns }) => ({
                  foreign_key_name: r.foreign_key_name,
                  schema: vtkd.view_schema,
                  relation: vtkd.view_name,
                  columns: viewColumns,
                  is_one_to_one: r.is_one_to_one,
                  referenced_schema: tvkd.view_schema,
                  referenced_relation: tvkd.view_name,
                  referenced_columns: referencedViewColumns,
                })
              )
            )
          )
        )

        return [
          ...viewToTableRelationships,
          ...tableToViewRelationships,
          ...viewToViewRelationships,
        ]
      })

      allViewM2oAndO2oRelationships = viewRelationships
    }

    return {
      data: allTableM2oAndO2oRelationships.concat(allViewM2oAndO2oRelationships),
      error: null,
    }
  }
}
