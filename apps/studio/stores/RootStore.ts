import { configure } from 'mobx'
import { Project } from 'types'
import UiStore, { IUiStore } from './UiStore'
import MetaStore, { IMetaStore } from './pgmeta/MetaStore'
import VaultStore, { IVaultStore } from './project/VaultStore'

// Temporary disable mobx warnings
// TODO: need to remove this after refactoring old stores.
configure({
  enforceActions: 'never',
})

export interface IRootStore {
  ui: IUiStore
  meta: IMetaStore
  vault: IVaultStore

  selectedProjectRef?: string

  setProject: (project: Project) => void
}
export class RootStore implements IRootStore {
  ui: IUiStore
  meta: IMetaStore
  vault: IVaultStore

  selectedProjectRef: string | undefined

  constructor() {
    this.ui = new UiStore(this)
    this.meta = new MetaStore(this, { projectRef: '', connectionString: '' })

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
    // ui set must come last
    this.ui.setProjectRef(project.ref)

    this.selectedProjectRef = project.ref
  }
}
