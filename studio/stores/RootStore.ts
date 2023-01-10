import { configure } from 'mobx'
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
  content: IProjectContentStore
  functions: IProjectFunctionsStore
  backups: IProjectBackupsStore
  authConfig: IProjectAuthConfigStore
  vault: IVaultStore

  selectedProjectRef?: string

  setProjectRef: (value: string) => void
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
  vault: IVaultStore

  selectedProjectRef: string | undefined

  constructor() {
    this.app = new AppStore(this)
    this.ui = new UiStore(this)
    this.meta = new MetaStore(this, { projectRef: '', connectionString: '' })

    this.content = new ProjectContentStore(this, { projectRef: '' })
    this.functions = new ProjectFunctionsStore(this, { projectRef: '' })
    this.backups = new ProjectBackupsStore(this, { projectRef: '' })
    this.authConfig = new ProjectAuthConfigStore(this, { projectRef: '' })
    this.vault = new VaultStore(this)
  }

  /**
   * Set selected project reference
   *
   * This method will also trigger project detail loading when it's not available
   */
  setProjectRef(value: string) {
    if (this.selectedProjectRef === value) return
    this.selectedProjectRef = value

    // reset ui projectRef in case of switching projects
    // this will show the loading screen instead of showing the previous project
    this.ui.setProjectRef(undefined)

    const setProjectRefs = (project: Project) => {
      this.meta.setProjectDetails(project)
      this.functions.setProjectRef(project.ref)
      this.authConfig.setProjectRef(project.ref)
      this.content.setProjectRef(project.ref)
      this.backups.setProjectRef(project.ref)
      // ui set must come last
      this.ui.setProjectRef(project.ref)
    }

    // fetch project detail when
    // - project not found yet. projectStore is loading
    // - connectionString is not available. projectStore loaded
    const found = this.app.projects.find((x: Project) => x.ref === value)
    if (found?.connectionString === undefined) {
      this.app.projects.fetchDetail(value, (project) => {
        setProjectRefs(project)
      })
    } else {
      setProjectRefs(found)
    }
  }

  setOrganizationSlug(value?: string) {
    if (this.ui.selectedOrganization?.slug != value) {
      this.ui.setOrganizationSlug(value)
    }
  }
}
