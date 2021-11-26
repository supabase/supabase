import PostgresMetaInterface from '../common/PostgresMetaInterface'
import { IRootStore } from '../RootStore'

export default class HooksStore extends PostgresMetaInterface<any> {
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
   * Get a list of all hooks data in the store as an array
   * @param filter A custom filter (eg: (x) => x.name === 'name')
   * @param options.allSchemas If true, will include "excluded" schemas
   */
  list(filter: any) {
    const hooksFilter = (h: any) =>
      h.function_schema === 'supabase_functions' &&
      h.schema !== 'net' &&
      (typeof filter === 'function' ? filter(h) : true)

    return super.list(hooksFilter)
  }
}
