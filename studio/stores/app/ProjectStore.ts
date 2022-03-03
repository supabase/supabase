import { Project } from 'types'
import { IRootStore } from '../RootStore'
import PostgresMetaInterface from '../common/PostgresMetaInterface'

export default class ProjectStore extends PostgresMetaInterface<Project> {
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
