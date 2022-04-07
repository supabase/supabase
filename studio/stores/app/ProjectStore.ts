import { Project, ResponseError } from 'types'
import { IRootStore } from '../RootStore'
import { constructHeaders } from 'lib/api/apiHelpers'
import { get } from 'lib/common/fetch'
import PostgresMetaInterface, { IPostgresMetaInterface } from '../common/PostgresMetaInterface'

export interface IProjectStore extends IPostgresMetaInterface<Project> {
  fetchDetail: (projectRef: string) => void
}

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

  async fetchDetail(projectRef: string) {
    const url = `${this.url}/${projectRef}`
    const headers = constructHeaders(this.headers)
    const response = await get(url, { headers })
    if (!response.error) {
      const project = response as Project
      this.data[project.id] = project
    }
  }
}
