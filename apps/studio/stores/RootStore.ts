import { configure } from 'mobx'

import type { Project } from 'data/projects/project-detail-query'
import UiStore, { IUiStore } from './UiStore'

// Temporary disable mobx warnings
// TODO: need to remove this after refactoring old stores.
configure({
  enforceActions: 'never',
})

export interface IRootStore {
  ui: IUiStore

  setProject: (project: Project) => void
}
export class RootStore implements IRootStore {
  ui: IUiStore

  constructor() {
    this.ui = new UiStore(this)
  }

  /**
   * Set selected project reference
   *
   * This method will also trigger project detail loading when it's not available
   */
  setProject(project: Project) {
    this.ui.setProjectRef(project.ref)
  }
}
