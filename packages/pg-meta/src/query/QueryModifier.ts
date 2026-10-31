import { safeSql, type SafeSqlFragment } from '../pg-format'
import {
  countQuery,
  deleteQuery,
  insertQuery,
  selectQuery,
  truncateQuery,
  updateQuery,
} from './Query.utils'
import type { ActionConfig, Filter, QueryPagination, QueryTable, Sort } from './types'

export interface IQueryModifier {
  range: (from: number, to: number) => QueryModifier
  toSql: () => SafeSqlFragment
}

export class QueryModifier implements IQueryModifier {
  protected pagination?: QueryPagination

  constructor(
    protected table: QueryTable,
    protected actionConfig: ActionConfig,
    protected options?: {
      actionOptions?: { returning?: boolean; cascade?: boolean; enumArrayColumns?: Array<string> }
      filters?: Array<Filter>
      sorts?: Array<Sort>
    }
  ) {}

  /**
   * Limits the result to rows within the specified range, inclusive.
   *
   * @param from  The starting index from which to limit the result, inclusive.
   * @param to  The last index to which to limit the result, inclusive.
   */
  range(from: number, to: number) {
    this.pagination = { offset: from, limit: to - from + 1 }
    return this
  }

  /**
   * Return SQL string for query chains
   */
  toSql(
    options: { isCTE: boolean; isFinal: boolean } = { isCTE: false, isFinal: true }
  ): SafeSqlFragment {
    try {
      const { actionOptions, filters, sorts } = this.options ?? {}
      switch (this.actionConfig.action) {
        case 'count': {
          return countQuery(this.table, { filters })
        }
        case 'delete': {
          return deleteQuery(this.table, filters, {
            returning: actionOptions?.returning,
            enumArrayColumns: actionOptions?.enumArrayColumns,
          })
        }
        case 'insert': {
          return insertQuery(this.table, this.actionConfig.actionValue, {
            returning: actionOptions?.returning,
            enumArrayColumns: actionOptions?.enumArrayColumns,
          })
        }
        case 'select': {
          return selectQuery(
            this.table,
            this.actionConfig.actionValue,
            {
              filters,
              pagination: this.pagination,
              sorts,
            },
            options.isFinal,
            options.isCTE
          )
        }
        case 'update': {
          return updateQuery(this.table, this.actionConfig.actionValue, {
            filters,
            returning: actionOptions?.returning,
            enumArrayColumns: actionOptions?.enumArrayColumns,
          })
        }
        case 'truncate': {
          return truncateQuery(this.table, {
            cascade: actionOptions?.cascade,
          })
        }
        default: {
          return safeSql``
        }
      }
    } catch (error) {
      throw error
    }
  }
}
