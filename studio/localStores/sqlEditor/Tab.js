import { makeObservable, action, observable, computed } from 'mobx'
import { makeRandomString } from 'lib/helpers'

class Tab {
  id
  name
  desc
  type
  favorite

  constructor(name, type, desc = '', favorite = false) {
    makeObservable(this, {
      id: observable,
      name: observable,
      desc: observable,
      type: observable,
      favorite: observable,
      renameModel: computed,
      rename: action,
    })

    this.id = `${makeRandomString(4)}-${Date.now()}`
    this.name = name
    this.type = type
    this.desc = desc
    this.favorite = favorite
  }

  get renameModel() {
    return { name: this.name, desc: this.desc }
  }

  rename(model) {
    this.name = model.name
    this.desc = model.desc
  }
}
export default Tab
