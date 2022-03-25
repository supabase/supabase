import { configure, reaction } from 'mobx'
import AppStore, { IAppStore } from './app/AppStore'
import MetaStore, { IMetaStore } from './pgmeta/MetaStore'
import UiStore, { IUiStore } from './UiStore'
import ProjectContentStore, { IProjectContentStore } from './content/ProjectContentStore'
import ProjectFunctionsStore, { IProjectFunctionsStore } from './functions/ProjectFunctionsStore'

// Temporary disable mobx warnings
// TODO: need to remove this after refactoring old stores.
configure({
  enforceActions: 'never',
})

export interface IRootStore {
  ui: IUiStore
  content: IProjectContentStore
  functions: IProjectFunctionsStore
  meta: IMetaStore
  app: IAppStore
  setProjectRef: (value?: string) => void
  setOrganizationSlug: (value?: string) => void
}
export class RootStore implements IRootStore {
  ui: IUiStore
  content: IProjectContentStore
  functions: IProjectFunctionsStore
  meta: IMetaStore
  app: IAppStore

  constructor() {
    this.ui = new UiStore(this)
    this.content = new ProjectContentStore(this, { projectRef: '' })
    this.functions = new ProjectFunctionsStore(this, { projectRef: '' })
    this.meta = new MetaStore(this, {
      projectRef: '',
      connectionString: '',
    })
    this.app = new AppStore(this)

    /**
     * TODO: meta and content are not observable
     * meaning that when meta and content object change mobx doesnt trigger new event
     *
     * Workaround for now
     * we need to use ui.selectedProject along with meta and content
     * cos whenever ui.selectedProject changes, the reaction will create new meta and content stores
     */
    reaction(
      () => this.ui.selectedProject,
      (selectedProject) => {
        if (selectedProject) {
          this.content = new ProjectContentStore(this, { projectRef: selectedProject.ref })
          this.functions = new ProjectFunctionsStore(this, { projectRef: selectedProject.ref })
          this.meta = new MetaStore(this, {
            projectRef: selectedProject.ref,
            connectionString: selectedProject.connectionString ?? '',
          })
        } else {
          this.content = new ProjectContentStore(this, { projectRef: '' })
          this.functions = new ProjectFunctionsStore(this, { projectRef: '' })
          this.meta = new MetaStore(this, {
            projectRef: '',
            connectionString: '',
          })
        }
      }
    )
  }

  setProjectRef(value?: string) {
    if (this.ui.selectedProject?.ref === value) return
    this.ui.setProjectRef(value)
  }

  setOrganizationSlug(value?: string) {
    if (this.ui.selectedOrganization?.slug != value) {
      this.ui.setOrganizationSlug(value)
    }
  }
}
