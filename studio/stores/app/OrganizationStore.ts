import { Organization } from 'types'
import { IRootStore } from '../RootStore'
import PostgresMetaInterface from '../common/PostgresMetaInterface'

export default class OrganizationStore extends PostgresMetaInterface<Organization> {
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
