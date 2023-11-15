import { configure } from 'mobx'
import { Project } from 'types'
import UiStore, { IUiStore } from './UiStore'
import AppStore, { IAppStore } from './app/AppStore'
import MetaStore, { IMetaStore } from './pgmeta/MetaStore'
import ProjectFunctionsStore, { IProjectFunctionsStore } from './project/ProjectFunctionsStore'
import VaultStore, { IVaultStore } from './project/VaultStore'

// Temporary disable mobx warnings
// TODO: need to remove this after refactoring old stores.
configure({
  enforceActions: 'never',
})

export interface IRootStore {
  app: IAppStore
  ui: IUiStore
  meta: IMetaStore
  functions: IProjectFunctionsStore
  vault: IVaultStore

  selectedProjectRef?: string

  setProject: (project: Project) => void
}
export class RootStore implements IRootStore {
  app: IAppStore
  ui: IUiStore
  meta: IMetaStore
  functions: IProjectFunctionsStore
  vault: IVaultStore

  selectedProjectRef: string | undefined

  constructor() {
    this.app = new AppStore(this)
    this.ui = new UiStore(this)
    this.meta = new MetaStore(this, { projectRef: '', connectionString: '' })

    this.functions = new ProjectFunctionsStore(this, { projectRef: '' })
    this.vault = new VaultStore(this)
  }

  /**
   * Set selected project reference
   *
   * This method will also trigger project detail loading when it's not available
   */
  setProject(project: Project) {
    if (this.selectedProjectRef === project.ref) return

    // reset ui projectRef in case of switching projects
    // this will show the loading screen instead of showing the previous project
    this.ui.setProjectRef(undefined)

    this.meta.setProjectDetails(project)
    this.functions.setProjectRef(project.ref)
    // ui set must come last
    this.ui.setProjectRef(project.ref)

    this.selectedProjectRef = project.ref
  }
}
