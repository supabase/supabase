import { IQueryModifier, QueryModifier } from './QueryModifier'
import type { ActionConfig, Dictionary, Filter, FilterOperator, QueryTable, Sort } from './types'

export interface IQueryFilter {
  filter: (column: string, operator: FilterOperator, value: string) => IQueryFilter
  match: (criteria: Dictionary<any>) => IQueryFilter
  order: (table: string, column: string, ascending?: boolean, nullsFirst?: boolean) => IQueryFilter
}

export class QueryFilter implements IQueryFilter, IQueryModifier {
  protected filters: Array<Filter> = []
  protected sorts: Array<Sort> = []

  constructor(
    protected table: QueryTable,
    protected actionConfig: ActionConfig,
    protected actionOptions?: { returning: boolean; enumArrayColumns?: Array<string> }
  ) {}

  filter(column: string | string[], operator: FilterOperator, value: any) {
    this.filters.push({ column, operator, value })
    return this
  }

  match(criteria: Dictionary<any>) {
    Object.entries(criteria).map(([column, value]) => {
      this.filters.push({ column, operator: '=', value })
    })
    return this
  }

  order(table: string, column: string, ascending = true, nullsFirst = false) {
    this.sorts.push({
      table: table,
      column: column,
      ascending,
      nullsFirst,
    })
    return this
  }

  range(from: number, to: number) {
    return this._getQueryModifier().range(from, to)
  }

  clone(): QueryFilter {
    const clonedData = structuredClone({
      table: this.table,
      actionConfig: this.actionConfig,
      actionOptions: this.actionOptions,
      filters: this.filters,
      sorts: this.sorts,
    })

    const cloned = new QueryFilter(
      clonedData.table,
      clonedData.actionConfig,
      clonedData.actionOptions
    )

    cloned.filters = clonedData.filters
    cloned.sorts = clonedData.sorts

    return cloned
  }

  toSql(options?: { isCTE: boolean; isFinal: boolean }) {
    return this._getQueryModifier().toSql(options)
  }

  _getQueryModifier() {
    return new QueryModifier(this.table, this.actionConfig, {
      actionOptions: this.actionOptions,
      filters: this.filters,
      sorts: this.sorts,
    })
  }
}
