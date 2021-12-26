import { uuidv4 } from 'lib/helpers'
import { action, makeAutoObservable } from 'mobx'
import { Project, Notification, User, Organization } from 'types'
import { IRootStore } from './RootStore'
import Telemetry from 'lib/telemetry'

export interface IUiStore {
  language: 'en_US'
  theme: 'dark' | 'light'

  isDarkTheme: boolean
  selectedProject?: Project
  selectedOrganization?: Organization
  notification?: Notification
  profile?: User

  load: () => void
  toggleTheme: () => void
  setTheme: (theme: 'dark' | 'light') => void
  setProjectRef: (ref?: string) => void
  setOrganizationSlug: (slug?: string) => void
  setNotification: (notification: Notification) => string
  setProfile: (value?: User) => void
}
export default class UiStore implements IUiStore {
  rootStore: IRootStore
  language: 'en_US' = 'en_US'
  theme: 'dark' | 'light' = 'dark'

  selectedProjectRef?: string
  selectedOrganizationSlug?: string
  notification?: Notification
  profile?: User

  constructor(rootStore: IRootStore) {
    this.rootStore = rootStore
    makeAutoObservable(this, {
      setProjectRef: action,
      setOrganizationSlug: action,
    })
  }

  get selectedProject() {
    if (this.selectedProjectRef) {
      const found = this.rootStore.app.projects.find(
        (x: Project) => x.ref == this.selectedProjectRef
      )
      return found
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

  get isDarkTheme() {
    return this.theme === 'dark'
  }

  load() {
    if (typeof window === 'undefined') return
    const savedTheme = (window.localStorage.getItem('theme') ?? 'dark') as 'dark' | 'light'
    this.setTheme(savedTheme)
  }

  toggleTheme() {
    if (this.theme === 'dark') {
      this.setTheme('light')
    } else {
      this.setTheme('dark')
    }
  }

  setTheme(theme: 'dark' | 'light') {
    this.theme = theme
    window.localStorage.setItem('theme', theme)
    document.body.className = theme
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

  setProfile(value?: User) {
    if (value && value?.id != this.profile?.id) {
      Telemetry.sendIdentify(value)
    }

    this.profile = value
  }
}
