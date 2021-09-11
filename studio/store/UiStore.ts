import { makeAutoObservable, observable } from 'mobx'

export default class UiState {
  language = 'en_US'
  storageModelOpen = false

  constructor() {
    makeAutoObservable(this)
  }
}
