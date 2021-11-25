import { makeAutoObservable } from 'mobx'

class Favorite {
  key
  name
  desc
  query

  constructor(key, query, name, desc) {
    makeAutoObservable(this)

    this.key = key
    this.query = query
    this.name = name
    this.desc = desc
  }

  get renameModel() {
    return { name: this.name, desc: this.desc }
  }

  rename(model) {
    this.name = model.name
    this.desc = model.desc
  }
}
export default Favorite
