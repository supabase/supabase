import { makeAutoObservable } from 'mobx'

import { uuidv4 } from 'lib/helpers'
import type { Notification } from 'types'

export interface IUiStore {
  notification?: Notification
  setNotification: (notification: Notification) => string
}
export default class UiStore implements IUiStore {
  notification?: Notification

  constructor() {
    makeAutoObservable(this)
  }

  setNotification(notification: Notification): string {
    const id = notification?.id ?? uuidv4()
    this.notification = { ...notification, id }
    return id
  }
}
