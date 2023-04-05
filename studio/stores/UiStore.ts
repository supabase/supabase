import { uuidv4 } from 'lib/helpers'
import { action, makeAutoObservable } from 'mobx'
import { Project, Notification, User, Organization, ProjectBase, Permission } from 'types'
import { IRootStore } from './RootStore'
import Telemetry, { GoogleAnalyticsProps } from 'lib/telemetry'

export interface IUiStore {
  language: 'en-US'
  theme: 'dark' | 'light'
  themeOption: 'dark' | 'light' | 'system'

  selectedProjectRef?: string
  isDarkTheme: boolean
  selectedProject?: Project
  selectedProjectBaseInfo?: ProjectBase
  selectedOrganization?: Organization
  notification?: Notification
  permissions?: Permission[]

  googleAnalyticsProps?: GoogleAnalyticsProps

  load: () => void
  setTheme: (theme: 'dark' | 'light') => void
  onThemeOptionChange: (themeOption: 'dark' | 'light' | 'system') => void
  setProjectRef: (ref?: string) => void
  setOrganizationSlug: (slug?: string) => void
  setNotification: (notification: Notification) => string
  setProfile: (value: User) => void
  setPermissions: (permissions?: Permission[]) => void
  setGaClientId: (clientId?: string) => void
}
export default class UiStore implements IUiStore {
  rootStore: IRootStore
  language: 'en-US' = 'en-US'
  theme: 'dark' | 'light' = 'dark'
  themeOption: 'dark' | 'light' | 'system' = 'dark'

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

  get isDarkTheme() {
    return this.theme === 'dark'
  }

  get googleAnalyticsProps() {
    return {
      screenResolution:
        typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
      language: this.language,
    }
  }

  load() {
    if (typeof window === 'undefined') return
    const localStorageThemeOption = window.localStorage.getItem('theme')
    if (localStorageThemeOption === 'system') {
      this.themeOption = localStorageThemeOption
      return this.setTheme(
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      )
    }
    if (localStorageThemeOption === 'light') {
      this.themeOption = localStorageThemeOption
      return this.setTheme('light')
    }
    window.localStorage.setItem('theme', 'dark')
    this.themeOption = 'dark'
    this.setTheme('dark')
  }

  setTheme(theme: 'dark' | 'light') {
    document.body.classList.replace(this.theme, theme)
    this.theme = theme
  }

  onThemeOptionChange(themeOption: 'dark' | 'light' | 'system') {
    this.themeOption = themeOption
    if (themeOption === 'system') {
      window.localStorage.setItem('theme', 'system')
      return this.setTheme(
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      )
    }
    window.localStorage.setItem('theme', themeOption)
    this.setTheme(themeOption)
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

  setProfile(value: User) {
    Telemetry.sendIdentify(value, this.googleAnalyticsProps)
  }

  setPermissions(permissions?: any) {
    this.permissions = permissions
  }

  setGaClientId(clientId?: string) {
    /**
     * We need to access ga client_id from base.constructHeaders method
     * in order to set custom header('ga_client_id).
     * TODO: Do we have a better way than storing in local storage?
     */
    window.localStorage.setItem('ga_client_id', String(clientId))
  }
}
