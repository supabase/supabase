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

  initialDataArray(value: Project[]) {
    const finalValue = value.map((project: any) => {
      const kpsVersion =
        project?.services?.length > 0
          ? project?.services[0]?.infrastructure[0]?.app_versions?.version
          : undefined

      return { ...project, kpsVersion }
    })
    super.initialDataArray(finalValue)
  }
}
