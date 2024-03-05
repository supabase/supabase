import { configure } from 'mobx'

import type { Project } from 'data/projects/project-detail-query'
import UiStore, { IUiStore } from './UiStore'
import MetaStore, { IMetaStore } from './pgmeta/MetaStore'

// Temporary disable mobx warnings
// TODO: need to remove this after refactoring old stores.
configure({
  enforceActions: 'never',
})

export interface IRootStore {
  ui: IUiStore
  meta: IMetaStore

  setProject: (project: Project) => void
}
export class RootStore implements IRootStore {
  ui: IUiStore
  meta: IMetaStore

  constructor() {
    this.ui = new UiStore(this)
    this.meta = new MetaStore(this, { projectRef: '', connectionString: '' })
  }

  /**
   * Set selected project reference
   *
   * This method will also trigger project detail loading when it's not available
   */
  setProject(project: Project) {
    this.meta.setProjectDetails(project)
    // ui set must come last
    this.ui.setProjectRef(project.ref)
  }
}
