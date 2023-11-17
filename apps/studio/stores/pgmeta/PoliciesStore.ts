import PostgresMetaInterface from '../common/PostgresMetaInterface'
import { IRootStore } from '../RootStore'

export default class PoliciesStore extends PostgresMetaInterface<any> {
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
}
