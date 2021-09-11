import AppStore from './AppStore'
import AppInterface from './AppInterface'

export interface Project  {
  id: number
  name: string
}

export default class TableStore extends AppInterface<Project> {
  constructor(rootStore: AppStore, dataUrl: string, options: object) {
    super(rootStore, dataUrl, options)
  }
}
