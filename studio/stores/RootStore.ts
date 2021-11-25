import { configure } from 'mobx'
import AppStore, { IAppStore } from './app/AppStore'
import MetaStore, { IMetaStore } from './pgmeta/MetaStore'
import UiStore, { IUiStore } from './UiStore'
import ProjectContentStore, { IProjectContentStore } from './content/ProjectContentStore'

// Temporary disable mobx warnings
// TODO: need to remove this after refactoring old stores.
configure({
  enforceActions: 'never',
})

export interface IRootStore {
  ui: IUiStore
  content: IProjectContentStore
  meta: IMetaStore
  app: IAppStore
  setProjectRef: (value?: string) => void
  setOrganizationSlug: (value?: string) => void
}
export class RootStore implements IRootStore {
  ui: IUiStore
  content: IProjectContentStore
  meta: IMetaStore
  app: IAppStore

  constructor() {
    this.ui = new UiStore(this)
    this.content = new ProjectContentStore(this, { projectRef: '' })
    this.meta = new MetaStore(this, {
      projectRef: '',
      connectionString: '',
    })
    this.app = new AppStore(this)
  }

  setProjectRef(value?: string) {
    if (this.ui.selectedProject?.ref != value) {
      this.ui.setProjectRef(value)
      this.content = new ProjectContentStore(this, { projectRef: value || '' })
      this.meta = new MetaStore(this, {
        projectRef: value || '',
        connectionString: this.ui.selectedProject?.connectionString ?? '',
      })
    }
  }

  setOrganizationSlug(value?: string) {
    if (this.ui.selectedOrganization?.slug != value) {
      this.ui.setOrganizationSlug(value)
    }
  }
}
