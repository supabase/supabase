import { configure, reaction } from 'mobx'
import { Project } from 'types'
import AppStore, { IAppStore } from './app/AppStore'
import MetaStore, { IMetaStore } from './pgmeta/MetaStore'
import UiStore, { IUiStore } from './UiStore'
import ProjectContentStore, { IProjectContentStore } from './project/ProjectContentStore'
import ProjectFunctionsStore, { IProjectFunctionsStore } from './project/ProjectFunctionsStore'
import ProjectBackupsStore, { IProjectBackupsStore } from './project/ProjectBackupsStore'
import ProjectAuthConfigStore, {
  IProjectAuthConfigStore,
} from './authConfig/ProjectAuthConfigStore'

// Temporary disable mobx warnings
// TODO: need to remove this after refactoring old stores.
configure({
  enforceActions: 'never',
})

export interface IRootStore {
  app: IAppStore
  ui: IUiStore
  meta: IMetaStore
  content: IProjectContentStore
  functions: IProjectFunctionsStore
  backups: IProjectBackupsStore
  authConfig: IProjectAuthConfigStore
  setProjectRef: (value?: string) => void
  setOrganizationSlug: (value?: string) => void
}
export class RootStore implements IRootStore {
  app: IAppStore
  ui: IUiStore
  meta: IMetaStore
  content: IProjectContentStore
  functions: IProjectFunctionsStore
  backups: IProjectBackupsStore
  authConfig: IProjectAuthConfigStore

  constructor() {
    this.app = new AppStore(this)
    this.ui = new UiStore(this)
    this.meta = new MetaStore(this, { projectRef: '', connectionString: '' })

    // @ts-ignore
    this.content = new ProjectContentStore(this, { projectRef: '' })
    this.functions = new ProjectFunctionsStore(this, { projectRef: '' })
    this.backups = new ProjectBackupsStore(this, { projectRef: '' })
    this.authConfig = new ProjectAuthConfigStore(this, { projectRef: '' })

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
          // @ts-ignore
          this.meta = new MetaStore(this, {
            projectRef: selectedProject.ref,
            connectionString: selectedProject.connectionString ?? '',
          })
        } else {
          // @ts-ignore
          this.meta = new MetaStore(this, {
            projectRef: '',
            connectionString: '',
          })
        }
      }
    )
  }

  /**
   * Set selected project reference
   *
   * This method will also trigger project detail loading when it's not available
   */
  setProjectRef(value?: string) {
    if (this.ui.selectedProject?.ref === value) return
    if (value) {
      // fetch project detail when
      // - project not found yet. projectStore is loading
      // - connectionString is not available. projectStore loaded
      const found = this.app.projects.find((x: Project) => x.ref == value)
      if (!found || !found.connectionString) {
        this.app.projects.fetchDetail(value)
      }
    }

    this.ui.setProjectRef(value)
    this.functions.setProjectRef(value)
    this.authConfig.setProjectRef(value)
    this.content.setProjectRef(value)
    this.backups.setProjectRef(value)
  }

  setOrganizationSlug(value?: string) {
    if (this.ui.selectedOrganization?.slug != value) {
      this.ui.setOrganizationSlug(value)
    }
  }
}
