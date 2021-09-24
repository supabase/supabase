import DataStore from '../DataStore'
import ProjectStore from './ProjectStore'

export default class AppStore {
  rootStore: DataStore
  apiUrl: string
  projects: ProjectStore

  constructor(rootStore: DataStore, apiUrl: string) {
    this.rootStore = rootStore
    this.apiUrl = apiUrl || `http://localhost:8080/api`
    let options = {}
    this.projects = new ProjectStore(this, `${this.apiUrl}/projects`, options)
  }
}
