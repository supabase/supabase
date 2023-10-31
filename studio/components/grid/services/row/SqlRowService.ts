import { IRowService } from '.'
import { Filter, ServiceError, Sort, SupaRow, SupaTable } from '../../types'
import { ERROR_PRIMARY_KEY_NOTFOUND, SupabaseGridQueue } from '../../constants'
import Query from '../../query'
import { isNumericalColumn } from '../../utils'

export class SqlRowService implements IRowService {
  protected query = new Query()

  constructor(
    protected table: SupaTable,
    protected onSqlQuery: (query: string) => Promise<{ data?: any; error?: any }>,
    protected onError: (error: any) => void
  ) {}

  async count(filters: Filter[]) {
    let queryChains = this.query.from(this.table.name, this.table.schema ?? undefined).count()
    filters
      .filter((x) => x.value && x.value != '')
      .forEach((x) => {
        const value = this.formatFilterValue(x)
        queryChains = queryChains.filter(x.column, x.operator, value)
      })

    const query = queryChains.toSql()
    const { data, error } = await this.onSqlQuery(query)
    if (error) {
      return { error }
    } else {
      if (data?.length == 1) {
        return { data: data[0].count }
      } else {
        return { error: { message: 'fetch rows count failed' } }
      }
    }
  }

  async delete(rows: SupaRow[]) {
    const { primaryKeys, error } = this.getPrimaryKeys()
    if (error) return { error }

    let queryChains = this.query.from(this.table.name, this.table.schema ?? undefined).delete()

    primaryKeys!.forEach((key) => {
      const primaryKeyValues = rows.map((x) => x[key])
      queryChains = queryChains.filter(key, 'in', primaryKeyValues)
    })

    const query = queryChains.toSql()
    return await this.onSqlQuery(query)
  }

  // For deleting all rows based on a given filter
  async deleteAll(filters: Filter[]) {
    let queryChains = this.query.from(this.table.name, this.table.schema ?? undefined).delete()

    filters
      .filter((x) => x.value && x.value !== '')
      .forEach((x) => {
        const value = this.formatFilterValue(x)
        queryChains = queryChains.filter(x.column, x.operator, value)
      })

    const query = queryChains.toSql()
    return await this.onSqlQuery(query)
  }

  // For deleting all rows without any filter (clear entire table)
  async truncate() {
    let queryChains = this.query.from(this.table.name, this.table.schema ?? undefined).truncate()
    const query = queryChains.toSql()
    return await this.onSqlQuery(query)
  }

  async fetchPage(page: number, rowsPerPage: number, filters: Filter[], sorts: Sort[]) {
    const pageFromZero = page > 0 ? page - 1 : page
    const from = pageFromZero * rowsPerPage
    const to = (pageFromZero + 1) * rowsPerPage - 1

    const enumArrayColumns = this.table.columns
      .filter((column) => {
        return (column?.enum ?? []).length > 0 && column.dataType.toLowerCase() === 'array'
      })
      .map((column) => column.name)

    let queryChains =
      enumArrayColumns.length > 0
        ? this.query
            .from(this.table.name, this.table.schema ?? undefined)
            .select(`*,${enumArrayColumns.map((x) => `"${x}"::text[]`).join(',')}`)
        : this.query.from(this.table.name, this.table.schema ?? undefined).select()

    filters
      .filter((x) => x.value && x.value != '')
      .forEach((x) => {
        const value = this.formatFilterValue(x)
        queryChains = queryChains.filter(x.column, x.operator, value)
      })
    sorts.forEach((x) => {
      queryChains = queryChains.order(x.column, x.ascending, x.nullsFirst)
    })

    const query = queryChains.range(from, to).toSql()
    const { data, error } = await this.onSqlQuery(query)
    if (error) {
      this.onError(error)
      return { data: { rows: [] } }
    } else if (Array.isArray(data)) {
      const rows = data?.map((x: any, index: number) => {
        return { idx: index, ...x } as SupaRow
      })
      return { data: { rows } }
    } else {
      console.error('Fetch page:', data)
      this.onError({ message: 'Data received is not formatted properly' })
      return { data: { rows: [] } }
    }
  }

  async fetchAllData(filters: Filter[], sorts: Sort[]) {
    // Paginate the request for very large tables to prevent stalling of API
    const rows: any[] = []

    let queryChains = this.query.from(this.table.name, this.table.schema ?? undefined).select()

    filters
      .filter((x) => x.value && x.value != '')
      .forEach((x) => {
        const value = this.formatFilterValue(x)
        queryChains = queryChains.filter(x.column, x.operator, value)
      })
    sorts.forEach((x) => {
      queryChains = queryChains.order(x.column, x.ascending, x.nullsFirst)
    })

    // Starting from page 0, fetch 500 records per call
    let page = -1
    let from = 0
    let to = 0
    let pageData = []
    const rowsPerPage = 500

    await (async () => {
      do {
        page += 1
        from = page * rowsPerPage
        to = (page + 1) * rowsPerPage - 1
        const query = queryChains.range(from, to).toSql()
        const { data, error } = await this.onSqlQuery(query)

        if (error) {
          this.onError(error)
          return { data: { rows: [] } }
        } else {
          rows.push(...data)
          pageData = data
        }
      } while (pageData.length === rowsPerPage)
    })()

    return rows
  }

  update(
    row: SupaRow,
    originalRow: SupaRow,
    changedColumn?: string,
    onRowUpdate?: (value: any) => void
  ) {
    const { primaryKeys, error } = this.getPrimaryKeys()
    if (error) {
      return { error }
    }
    const { idx, ...value } = row

    // Optimistic rendering
    if (onRowUpdate) onRowUpdate({ row: value, idx })

    const matchValues: any = {}
    primaryKeys!.forEach((key) => {
      matchValues[key] = row[key]
      // fix: https://github.com/supabase/grid/issues/94
      // remove primary key from updated value object
      delete value[key]
    })
    const enumArrayColumns = this.table.columns
      .filter((column) => {
        return (column?.enum ?? []).length > 0 && column.dataType.toLowerCase() === 'array'
      })
      .map((column) => column.name)
    const query = this.query
      .from(this.table.name, this.table.schema ?? undefined)
      .update(
        changedColumn
          ? {
              [changedColumn]: value[changedColumn],
            }
          : value,
        { returning: true, enumArrayColumns }
      )
      .match(matchValues)
      .toSql()

    SupabaseGridQueue.add(async () => {
      const { data, error } = await this.onSqlQuery(query)
      if (error) throw error
      if (onRowUpdate) onRowUpdate({ row: data[0], idx })
    }).catch((error) => {
      const { idx, ...originalRowData } = originalRow
      // Revert optimistic rendering if any errors
      if (onRowUpdate) onRowUpdate({ row: originalRowData, idx })
      this.onError(error)
    })

    return {}
  }

  getPrimaryKeys(): { primaryKeys?: string[]; error?: ServiceError } {
    const pkColumns = this.table.columns.filter((x) => x.isPrimaryKey)
    if (!pkColumns || pkColumns.length == 0) {
      return { error: { message: ERROR_PRIMARY_KEY_NOTFOUND } }
    }
    return { primaryKeys: pkColumns.map((x) => x.name) }
  }

  /**
   * temporary fix until we impliment a better filter UI
   * which validate input value base on the column type
   */
  formatFilterValue(filter: Filter) {
    const column = this.table.columns.find((x) => x.name == filter.column)
    if (column && isNumericalColumn(column.format)) {
      const numberValue = Number(filter.value)
      if (Number.isNaN(numberValue)) return filter.value
      else return Number(filter.value)
    }
    return filter.value
  }
}
