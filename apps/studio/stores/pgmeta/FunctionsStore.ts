import PostgresMetaInterface from '../common/PostgresMetaInterface'
import { IRootStore } from '../RootStore'

export default class FunctionsStore extends PostgresMetaInterface<any> {
  constructor(
    rootStore: IRootStore,
    dataUrl: string,
    headers?: {
      [prop: string]: any
    },
    options?: { identifier: string }
  ) {
    super(rootStore, dataUrl, headers, options)
  }

  /**
   * Get a list of all trigger functions data in the store as an array
   * @param filter A custom filter (eg: (x) => x.name === 'name')
   * @param options.allSchemas If true, will include "excluded" schemas
   */
  listTriggerFunctions(filter: any, options: any) {
    return this.listByReturnType('trigger', filter)
  }

  /**
   * Get a list of all functions data by return type in the store as an array
   * @param returnType Valid Postgres function return type (e.g. trigger, uuid, int4, etc.)
   * @param filter A custom filter (eg: (x) => x.name === 'name')
   * @param options.allSchemas If true, will include "excluded" schemas
   */
  listByReturnType(returnType: any, filter: any) {
    const typeFilter = (h: any) =>
      h.return_type === returnType && (typeof filter === 'function' ? filter(h) : true)

    return super.list(typeFilter)
  }
}
