import type { SafeSqlFragment } from '../pg-format'
import { IQueryFilter, QueryFilter } from './QueryFilter'
import type { Dictionary, QueryTable } from './types'

export interface IQueryAction {
  count: () => IQueryFilter
  delete: (options?: { returning: boolean }) => IQueryFilter
  insert: (values: Array<Dictionary<any>>, options?: { returning: boolean }) => IQueryFilter
  select: (columns?: SafeSqlFragment) => IQueryFilter
  update: (value: Dictionary<any>, options?: { returning: boolean }) => IQueryFilter
  truncate: (options?: { returning: boolean }) => IQueryFilter
}

export class QueryAction implements IQueryAction {
  constructor(protected table: QueryTable) {}

  /**
   * Performs a COUNT on the table.
   */
  count() {
    return new QueryFilter(this.table, { action: 'count' })
  }

  /**
   * Performs a DELETE on the table.
   *
   * @param options.returning  If `true`, return the deleted row(s) in the response.
   */
  delete(options?: { returning: boolean; enumArrayColumns?: Array<string> }) {
    return new QueryFilter(this.table, { action: 'delete' }, options)
  }

  /**
   * Performs an INSERT into the table.
   *
   * @param values             The values to insert.
   * @param options.returning  If `true`, return the inserted row(s) in the response.
   */
  insert(
    values: Array<Dictionary<any>>,
    options?: { returning: boolean; enumArrayColumns?: Array<string> }
  ) {
    return new QueryFilter(this.table, { action: 'insert', actionValue: values }, options)
  }

  /**
   * Performs vertical filtering with SELECT.
   *
   * @param columns the query columns, by default set to '*'.
   */
  select(columns?: SafeSqlFragment) {
    return new QueryFilter(this.table, { action: 'select', actionValue: columns })
  }

  /**
   * Performs an UPDATE on the table.
   *
   * @param value  The value to update.
   * @param options.returning  If `true`, return the updated row(s) in the response.
   */
  update(
    value: Dictionary<any>,
    options?: { returning: boolean; enumArrayColumns?: Array<string> }
  ) {
    return new QueryFilter(this.table, { action: 'update', actionValue: value }, options)
  }

  /**
   * Performs a TRUNCATE on the table
   */
  truncate(options?: { returning: boolean; enumArrayColumns?: Array<string> }) {
    return new QueryFilter(this.table, { action: 'truncate' }, options)
  }
}
