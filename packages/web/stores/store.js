import { types, applySnapshot } from 'mobx-state-tree'

let store = null

// const Plugin = types.model({
//   id: types.string,
//   slug: types.string,
//   title: types.title,
// })

const Store = types
  .model({
    // Plugins: types.maybe(types.map(Plugin)),
  })
  .actions(self => {
    return {}
  })
  .views(self => ({
    pluginBySlug(slug) {
      return Object.entries(self.Plugin).find(x => x.slug == slug)
    },
  }))

export function initializeStore(isServer, snapshot = null) {
  if (isServer) store = Store.create({ })
  if (store === null) store = Store.create({ })
  if (snapshot) applySnapshot(store, snapshot)
  return store
}
