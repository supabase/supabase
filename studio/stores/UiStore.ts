import { action, makeAutoObservable } from 'mobx'

import { uuidv4 } from 'lib/helpers'
import { Notification } from 'types'
import { IRootStore } from './RootStore'

export interface IUiStore {
  language: 'en-US'
  selectedProjectRef?: string
  notification?: Notification
  setProjectRef: (ref?: string) => void
  setOrganizationSlug: (slug?: string) => void
  setNotification: (notification: Notification) => string
}
export default class UiStore implements IUiStore {
  rootStore: IRootStore
  language: 'en-US' = 'en-US'
  selectedProjectRef?: string
  selectedOrganizationSlug?: string
  notification?: Notification

  constructor(rootStore: IRootStore) {
    this.rootStore = rootStore
    makeAutoObservable(this, {
      setProjectRef: action,
      setOrganizationSlug: action,
    })
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
}
