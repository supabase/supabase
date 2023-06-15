import { uuidv4 } from 'lib/helpers'
import { action, makeAutoObservable } from 'mobx'
import { Project, Notification, Organization, ProjectBase, Permission } from 'types'
import { IRootStore } from './RootStore'

export interface IUiStore {
  language: 'en-US'
  selectedProjectRef?: string
  selectedProject?: Project
  selectedProjectBaseInfo?: ProjectBase
  selectedOrganization?: Organization
  notification?: Notification
  permissions?: Permission[]
  load: () => void
  setProjectRef: (ref?: string) => void
  setOrganizationSlug: (slug?: string) => void
  setNotification: (notification: Notification) => string
  setPermissions: (permissions?: Permission[]) => void
}
export default class UiStore implements IUiStore {
  rootStore: IRootStore
  language: 'en-US' = 'en-US'
  selectedProjectRef?: string
  selectedOrganizationSlug?: string
  notification?: Notification
  permissions?: Permission[] = []

  constructor(rootStore: IRootStore) {
    this.rootStore = rootStore
    makeAutoObservable(this, {
      setProjectRef: action,
      setOrganizationSlug: action,
    })
  }

  /**
   * we use this getter to check for project ready.
   * Only return selectedProject when it has full detail
   * like connectionString prop
   *
   * @returns Project or undefined
   */
  get selectedProject() {
    if (this.selectedProjectRef) {
      const found = this.rootStore.app.projects.find(
        (x: Project) => x.ref === this.selectedProjectRef
      )
      // Self-hosted project details has connectionString set to empty string
      return found?.connectionString !== undefined ? found : undefined
    }
    return undefined
  }

  /**
   * Get selected project base info.
   *
   * @return ProjectBase or undefined
   */
  get selectedProjectBaseInfo(): ProjectBase | undefined {
    if (this.selectedProjectRef) {
      return this.rootStore.app.projects.find((x: Project) => x.ref == this.selectedProjectRef)
    }
    return undefined
  }

  get selectedOrganization() {
    if (this.selectedOrganizationSlug) {
      const found = this.rootStore.app.organizations.find(
        (x: Organization) => x.slug == this.selectedOrganizationSlug
      )
      return found
    }
    if (this.selectedProjectRef) {
      const organizationId = this.selectedProject?.organization_id
      const found = this.rootStore.app.organizations.find(
        (x: Organization) => x.id == organizationId
      )
      return found
    }
    return undefined
  }

  load() {
    if (typeof window === 'undefined') return
  }

  setProjectRef(ref?: string) {
    this.selectedProjectRef = ref
  }

  setOrganizationSlug(slug?: string) {
    this.selectedOrganizationSlug = slug
  }

  setNotification(notification: Notification): string {
    const id = notification?.id ?? uuidv4()
    this.notification = { ...notification, id }
    return id
  }

  setPermissions(permissions?: any) {
    this.permissions = permissions
  }
}
