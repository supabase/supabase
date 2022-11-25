import { keyBy } from 'lodash'
import { Permission } from 'types'
import { IRootStore } from '../RootStore'
import PostgresMetaInterface from '../common/PostgresMetaInterface'

export default class PermissionsStore extends PostgresMetaInterface<Permission> {
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

  // [Joshen] Method override here as permissions are not identified by an id from the API
  setDataArray(value: any[]) {
    const formattedValues = value.map((permission, idx: number) => {
      return { ...permission, id: idx + 1 }
    })
    const formattedValue = keyBy(formattedValues, this.identifier)
    Object.keys(this.data).forEach((projectId) => {
      if (formattedValue[projectId] !== undefined) {
        formattedValue[projectId] = this.data[projectId]
      }
    })
    this.data = formattedValue
  }

  // [Joshen] Method override here as permissions do not have `name` property
  list() {
    return Object.values(this.data)
  }
}
